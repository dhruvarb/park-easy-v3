import { z } from "zod";
import pool, { query } from "../config/db.js";

const slotQuerySchema = z.object({
  vehicle: z.string().default("car"),
  duration: z.enum(["Hourly", "Daily", "Monthly"]).default("Hourly"),
  city: z.string().optional(),
  evOnly: z
    .union([z.boolean(), z.string().transform((value) => value === "true")])
    .optional()
    .default(false),
});

const createBookingSchema = z.object({
  lotId: z.string().uuid(),
  vehicleType: z.string().default("car"),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  amount: z.number().optional(),
  slotId: z.string().uuid().optional(),
});

export const listSlots = async (req, res, next) => {
  try {
    const filters = slotQuerySchema.parse(req.query);
    const { rows } = await query(
      `
      SELECT
        pl.id,
        pl.name,
        pl.address,
        pl.city,
        pl.latitude,
        pl.longitude,
        pl.has_ev AS "hasEv",
        pl.total_capacity AS "totalCapacity",
        pl.capacity_breakdown AS "capacityBreakdown",
        COALESCE(pl.images, '{}') AS images,
        COALESCE(json_agg(DISTINCT a.label) FILTER (WHERE a.label IS NOT NULL), '[]') AS amenities,
        jsonb_build_object(
          'hourly', sp.hourly,
          'daily', sp.daily,
          'monthly', sp.monthly
        ) AS pricing,
        COUNT(s.*) FILTER (WHERE s.is_available) AS "availableSlots"
      FROM parking_lots pl
      LEFT JOIN parking_lot_amenities pla ON pla.lot_id = pl.id
      LEFT JOIN amenities a ON a.id = pla.amenity_id
      JOIN slot_pricing sp ON sp.lot_id = pl.id AND sp.vehicle_type = $1
      LEFT JOIN parking_slots s ON s.lot_id = pl.id AND s.vehicle_type = $1
      WHERE ($2::boolean IS FALSE OR pl.has_ev = TRUE)
        AND ($3::text IS NULL OR pl.city = $3)
      GROUP BY pl.id, sp.hourly, sp.daily, sp.monthly
      ORDER BY (CASE WHEN pl.has_ev THEN 0 ELSE 1 END), "availableSlots" DESC
      `,
      [filters.vehicle, filters.evOnly, filters.city || null]
    );
    return res.json({ slots: rows });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid filters", issues: error.issues });
    }
    return next(error);
  }
};

export const getSlotDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Default to 'car' for pricing display, similar to listSlots default
    const vehicleType = "car";

    const { rows } = await query(
      `
      SELECT
        pl.id,
        pl.name,
        pl.address,
        pl.city,
        pl.latitude,
        pl.longitude,
        pl.has_ev AS "hasEv",
        pl.total_capacity AS "totalCapacity",
        pl.capacity_breakdown AS "capacityBreakdown",
        COALESCE(pl.images, '{}') AS images,
        COALESCE(json_agg(DISTINCT a.label) FILTER (WHERE a.label IS NOT NULL), '[]') AS amenities,
        jsonb_build_object(
          'hourly', sp.hourly,
          'daily', sp.daily,
          'monthly', sp.monthly
        ) AS pricing,
        COALESCE(
          json_agg(
            json_build_object(
              'id', s.id,
              'label', s.label,
              'type', UPPER(s.vehicle_type), -- Normalize for frontend matching
              'x', s.x,
              'y', s.y,
              'rotation', s.rotation,
              'is_available', s.is_available,
              'is_active', s.is_active
            )
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) AS slots,
        COUNT(s.*) FILTER (WHERE s.is_available) AS "availableSlots"
      FROM parking_lots pl
      LEFT JOIN parking_lot_amenities pla ON pla.lot_id = pl.id
      LEFT JOIN amenities a ON a.id = pla.amenity_id
      LEFT JOIN slot_pricing sp ON sp.lot_id = pl.id AND sp.vehicle_type = $2
      LEFT JOIN parking_slots s ON s.lot_id = pl.id 
      WHERE pl.id = $1
      GROUP BY pl.id, sp.hourly, sp.daily, sp.monthly
      `,
      [id, vehicleType]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Parking slot not found" });
    }

    return res.json({ slot: rows[0] });
  } catch (error) {
    return next(error);
  }
};

export const createBooking = async (req, res, next) => {
  try {
    const payload = createBookingSchema.parse(req.body);

    if (new Date(payload.startTime) >= new Date(payload.endTime)) {
      return res.status(400).json({ message: "End time must be after start time" });
    }

    // Check for available slot
    // If slotId is provided (Manual Selection), validate it.
    // If not (Quick Book), find any available slot.

    let slotId = payload.slotId;
    let slotNumber;

    if (slotId) {
      // Validate specific slot availability
      const specificSlotResult = await query(
        `SELECT id, label FROM parking_slots s
             WHERE s.id = $1
               AND s.lot_id = $2
               -- AND s.vehicle_type = $3
               AND s.is_available = true
               AND NOT EXISTS (
                 SELECT 1 FROM bookings b 
                 WHERE b.slot_id = s.id 
                   AND b.status = 'confirmed'
                   AND (b.start_time < $4 AND b.end_time > $3)
               )`,
        [slotId, payload.lotId, payload.startTime, payload.endTime]
      );

      if (specificSlotResult.rows.length === 0) {
        return res.status(400).json({ message: "Selected slot is not available for this time." });
      }
      slotNumber = specificSlotResult.rows[0].label;

      // Verify type match if needed (optional but good practice)
      // const slotType = ... (from query) 
      // if (slotType !== payload.vehicleType) ...

    } else {
      // Auto-Assign Logic (Fallback)
      const slotResult = await query(
        `SELECT id, label FROM parking_slots s
           WHERE s.lot_id = $1 
             AND s.vehicle_type = $2 
             AND s.is_available = true
             AND NOT EXISTS (
               SELECT 1 FROM bookings b 
               WHERE b.slot_id = s.id 
                 AND b.status = 'confirmed'
                 AND (b.start_time < $4 AND b.end_time > $3)
             )
           LIMIT 1`,
        [payload.lotId, payload.vehicleType, payload.startTime, payload.endTime]
      );

      if (slotResult.rows.length === 0) {
        return res.status(404).json({ message: "No slots available for this vehicle type" });
      }

      slotId = slotResult.rows[0].id;
      slotNumber = slotResult.rows[0].label;
    }


    // Fetch admin's UPI ID
    const lotOwner = await query(
      `SELECT u.upi_id FROM parking_lots pl
       JOIN users u ON pl.admin_id = u.id
       WHERE pl.id = $1`,
      [payload.lotId]
    );
    const adminUpiId = lotOwner.rows[0]?.upi_id;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check User Balance
      const balanceRes = await client.query('SELECT tokens FROM users WHERE id = $1', [req.user.id]);
      const currentBalance = balanceRes.rows[0]?.tokens || 0;
      const cost = payload.amount || 0;

      if (currentBalance < cost) {
        throw new Error("Insufficient tokens. Please top up your wallet.");
      }

      // Deduct Tokens
      await client.query('UPDATE users SET tokens = tokens - $1 WHERE id = $2', [cost, req.user.id]);
      await client.query(
        `INSERT INTO token_transactions(user_id, amount, type, description)
         VALUES($1, $2, 'debit', 'Parking Booking')`,
        [req.user.id, cost]
      );

      const { rows } = await client.query(
        `
          INSERT INTO bookings(slot_id, user_id, start_time, end_time, amount_paid, status)
          VALUES($1, $2, $3, $4, $5, 'confirmed')
          RETURNING *
      `,
        [
          slotId,
          req.user.id,
          payload.startTime,
          payload.endTime,
          cost,
        ]
      );

      const booking = rows[0];

      // Fetch slot label for response (Already fetched above as slotNumber)

      await client.query('COMMIT');

      return res.status(201).json({
        booking: booking,
        slotNumber: slotNumber,
        message: "Booking confirmed with Tokens"
      });
    } catch (err) {
      await client.query('ROLLBACK');
      // If custom error
      if (err.message.includes("Insufficient tokens")) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    } finally {
      client.release();
    }

  } catch (error) {
    if (error.code === '23503') {
      return res.status(401).json({ message: "User session invalid. Please log in again." });
    }
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid payload", issues: error.issues });
    }
    return next(error);
  }
};

export const listBookings = async (req, res) => {
  try {
    console.log("Fetching bookings for user:", req.user.id);
    const result = await query(
      `
      SELECT 
        b.id,
      b.start_time,
      b.end_time,
      b.amount_paid,
      b.status,
      b.created_at,
      pl.name as lot_name,
      pl.address,
      pl.latitude,
      pl.longitude,
      ps.vehicle_type,
      ps.is_ev,
      (SELECT status FROM refund_requests rr WHERE rr.booking_id = b.id LIMIT 1) as refund_status
      FROM bookings b
      JOIN parking_slots ps ON b.slot_id = ps.id
      JOIN parking_lots pl ON ps.lot_id = pl.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `,
      [req.user.id]
    );

    return res.json({ bookings: result.rows });
  } catch (error) {
    console.error("List bookings error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT p.*, pl.name as lot_name 
             FROM payments p
             LEFT JOIN bookings b ON p.booking_id = b.id
             LEFT JOIN parking_slots ps ON b.slot_id = ps.id
             LEFT JOIN parking_lots pl ON ps.lot_id = pl.id
             WHERE p.user_id = $1
             ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    return res.json({ payments: rows });
  } catch (error) {
    console.error("Get payment history error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const requestRefund = async (req, res) => {
  try {
    const { bookingId, reason } = req.body;

    // Check if booking exists and belongs to user
    const bookingRes = await query(
      "SELECT * FROM bookings WHERE id = $1 AND user_id = $2",
      [bookingId, req.user.id]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if already requested
    const existing = await query(
      "SELECT id FROM refund_requests WHERE booking_id = $1",
      [bookingId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Refund already requested for this booking" });
    }

    await query(
      `INSERT INTO refund_requests(booking_id, user_id, reason)
    VALUES($1, $2, $3)`,
      [bookingId, req.user.id, reason]
    );

    return res.status(201).json({ message: "Refund request submitted" });
  } catch (error) {
    console.error("Request refund error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getWalletBalance = async (req, res) => {
  try {
    const { rows } = await query('SELECT tokens FROM users WHERE id = $1', [req.user.id]);
    res.json({ tokens: rows[0]?.tokens || 0 });
  } catch (error) {
    console.error("Get wallet error:", error);
    res.status(500).json({ message: "Failed to fetch wallet balance" });
  }
};

export const topUpWallet = async (req, res) => {
  try {
    const { amount } = req.body; // INR amount, 1 INR = 1 Token
    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update User Tokens
      await client.query('UPDATE users SET tokens = tokens + $1 WHERE id = $2', [amount, req.user.id]);

      // Log Transaction
      await client.query(
        `INSERT INTO token_transactions(user_id, amount, type, description)
         VALUES($1, $2, 'credit', 'Wallet Top Up')`,
        [req.user.id, amount]
      );

      await client.query('COMMIT');
      res.json({ message: "Wallet topped up successfully" });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Top up error:", error);
    res.status(500).json({ message: "Top up failed" });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows } = await client.query('SELECT * FROM bookings WHERE id = $1 AND user_id = $2', [id, req.user.id]);
      if (rows.length === 0) throw new Error("Booking not found");

      const booking = rows[0];
      if (booking.status === 'cancelled') throw new Error("Booking already cancelled");

      const now = new Date();
      const start = new Date(booking.start_time);
      const diffMs = start - now;
      const diffMins = Math.floor(diffMs / 60000);

      let refundAmount = 0;
      if (diffMins > 30) {
        // Full Refund: Ensure amount is an integer for token logic
        refundAmount = Math.floor(Number(booking.amount_paid));
      }

      // Update Booking
      await client.query("UPDATE bookings SET status = 'cancelled' WHERE id = $1", [id]);

      // Refund Tokens if applicable
      if (refundAmount > 0) {
        await client.query('UPDATE users SET tokens = tokens + $1 WHERE id = $2', [refundAmount, req.user.id]);
        await client.query(
          `INSERT INTO token_transactions(user_id, amount, type, description)
           VALUES($1, $2, 'credit', 'Booking Refund')`,
          [req.user.id, refundAmount]
        );
      }

      await client.query('COMMIT');
      res.json({ message: "Booking cancelled", refund: refundAmount });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error("Cancel booking inner error:", err.message);
      res.status(400).json({ message: err.message });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ message: "Cancellation failed" });
  }
};

export const checkoutBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows } = await client.query('SELECT * FROM bookings WHERE id = $1 AND user_id = $2', [id, req.user.id]);
      if (rows.length === 0) throw new Error("Booking not found");
      const booking = rows[0];

      if (booking.actual_end_time) throw new Error("Already checked out");

      const now = new Date();
      const end = new Date(booking.end_time);

      let penalty = 0;
      if (now > end) {
        const overdueMs = now - end;
        const overdueHours = Math.ceil(overdueMs / (1000 * 60 * 60));
        penalty = overdueHours * 10; // 10 Tokens per hour penalty
      }

      // Update Booking
      await client.query(
        "UPDATE bookings SET actual_end_time = $1, penalty_paid = $2, status = 'completed' WHERE id = $3",
        [now, penalty, id]
      );

      // Deduct Penalty
      if (penalty > 0) {
        await client.query('UPDATE users SET tokens = tokens - $1 WHERE id = $2', [penalty, req.user.id]);
        await client.query(
          `INSERT INTO token_transactions(user_id, amount, type, description)
                 VALUES($1, $2, 'debit', 'Late Checkout Penalty')`,
          [req.user.id, penalty]
        );
      }

      await client.query('COMMIT');
      res.json({ message: "Checked out successfully", penalty });

    } catch (err) {
      await client.query('ROLLBACK');
      res.status(400).json({ message: err.message });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ message: "Checkout failed" });
  }
};

export const addFavorite = async (req, res) => {
  try {
    const { lotId } = req.body;
    if (!lotId) {
      return res.status(400).json({ message: "Lot ID is required" });
    }

    await query(
      `INSERT INTO favorites(user_id, lot_id) VALUES($1, $2) ON CONFLICT(user_id, lot_id) DO NOTHING`,
      [req.user.id, lotId]
    );

    return res.status(201).json({ message: "Added to favorites" });
  } catch (error) {
    console.error("Add favorite error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const { lotId } = req.params;

    await query(
      `DELETE FROM favorites WHERE user_id = $1 AND lot_id = $2`,
      [req.user.id, lotId]
    );

    return res.json({ message: "Removed from favorites" });
  } catch (error) {
    console.error("Remove favorite error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const listFavorites = async (req, res) => {
  try {
    // We need to fetch parking lot details for the favorites
    // We'll reuse the logic for fetching slots/lots but simplified for lots
    // Since we don't have a direct 'get lot details' endpoint that returns pricing/amenities in a simple way,
    // we will join tables.

    const result = await query(
      `
    SELECT
    pl.id,
      pl.name,
      pl.address,
      pl.has_ev,
      pl.latitude,
      pl.longitude,
      (
        SELECT json_agg(label)
            FROM parking_lot_amenities pla
            JOIN amenities a ON pla.amenity_id = a.id
            WHERE pla.lot_id = pl.id
        ) as amenities,
  (
    SELECT json_object_agg(vehicle_type, hourly)
            FROM slot_pricing sp
            WHERE sp.lot_id = pl.id
        ) as pricing,
  (
    SELECT COUNT(*)
            FROM parking_slots ps
            WHERE ps.lot_id = pl.id AND ps.is_available = TRUE
        ) as available_slots
      FROM favorites f
      JOIN parking_lots pl ON f.lot_id = pl.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
      `,
      [req.user.id]
    );

    // Transform the result to match the frontend expectation (camelCase)
    const favorites = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      address: row.address,
      hasEv: row.has_ev,
      amenities: row.amenities || [],
      pricing: row.pricing || {},
      availableSlots: parseInt(row.available_slots || 0),
      latitude: row.latitude,
      longitude: row.longitude
    }));

    return res.json({ favorites });
  } catch (error) {
    console.error("List favorites error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const listNotifications = async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ notifications: result.rows });
  } catch (error) {
    console.error("List notifications error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    await query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    return res.json({ message: "Marked as read" });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
      [req.user.id]
    );
    return res.json({ message: "Marked all as read" });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    return res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Delete notification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const clearAllNotifications = async (req, res) => {
  try {
    await query(
      `DELETE FROM notifications WHERE user_id = $1`,
      [req.user.id]
    );
    return res.json({ message: "All notifications cleared" });
  } catch (error) {
    console.error("Clear all notifications error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const addReview = async (req, res) => {
  try {
    const { lotId, rating, comment } = req.body;
    if (!lotId || !rating) {
      return res.status(400).json({ message: "Lot ID and rating are required" });
    }
    await query(
      `INSERT INTO reviews(user_id, lot_id, rating, comment) VALUES($1, $2, $3, $4)`,
      [req.user.id, lotId, rating, comment]
    );
    return res.status(201).json({ message: "Review added successfully" });
  } catch (error) {
    console.error("Add review error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT r.*, u.full_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.lot_id = $1 ORDER BY r.created_at DESC`,
      [id]
    );
    return res.json({ reviews: rows });
  } catch (error) {
    console.error("Get reviews error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
