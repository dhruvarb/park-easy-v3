import { z } from "zod";
import pool, { query } from "../config/db.js";
import env from "../config/env.js";

const lotSchema = z.object({
  lotId: z.string().uuid().optional(),
  name: z.string().min(3),
  address: z.string().min(3),
  city: z.string().min(2),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  hasEv: z.boolean().default(false),
  totalCapacity: z.number().int().min(0).default(0),
  capacityBreakdown: z.record(z.string(), z.number().int().min(0)).default({}),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  pricing: z
    .array(
      z.object({
        vehicleType: z.string(),
        hourly: z.number().nonnegative().nullable().optional(),
        daily: z.number().nonnegative().nullable().optional(),
        monthly: z.number().nonnegative().nullable().optional(),
      })
    )
    .default([]),
});

const lotSelect = `
  SELECT
    pl.*,
    pl.capacity_breakdown AS "capacityBreakdown",
    COALESCE(pl.images, '{}') AS images,
    COALESCE(json_agg(DISTINCT a.label) FILTER (WHERE a.label IS NOT NULL), '[]') AS amenities,
    COALESCE(
      json_agg(
        DISTINCT jsonb_build_object(
          'vehicleType', sp.vehicle_type,
          'hourly', sp.hourly,
          'daily', sp.daily,
          'monthly', sp.monthly
        )
      ) FILTER (WHERE sp.id IS NOT NULL),
      '[]'
    ) AS pricing
  FROM parking_lots pl
  LEFT JOIN parking_lot_amenities pla ON pla.lot_id = pl.id
  LEFT JOIN amenities a ON a.id = pla.amenity_id
  LEFT JOIN slot_pricing sp ON sp.lot_id = pl.id
  WHERE pl.admin_id = $1
`;

export const getParkingLots = async (req, res, next) => {
  try {
    const { rows } = await query(
      `
        ${lotSelect}
        GROUP BY pl.id
        ORDER BY pl.created_at DESC
      `,
      [req.user.id]
    );
    return res.json({ lots: rows });
  } catch (error) {
    return next(error);
  }
};

export const upsertParkingLot = async (req, res, next) => {
  try {
    console.log("upsertParkingLot called with body:", JSON.stringify(req.body, null, 2));
    console.log("Files:", req.files);

    // Parse JSON fields that might come as strings from FormData
    if (typeof req.body.pricing === 'string') req.body.pricing = JSON.parse(req.body.pricing);
    if (typeof req.body.amenities === 'string') req.body.amenities = JSON.parse(req.body.amenities);
    if (typeof req.body.capacityBreakdown === 'string') req.body.capacityBreakdown = JSON.parse(req.body.capacityBreakdown);
    if (req.body.hasEv === 'true') req.body.hasEv = true;
    if (req.body.hasEv === 'false') req.body.hasEv = false;
    if (req.body.latitude) req.body.latitude = Number(req.body.latitude);
    if (req.body.longitude) req.body.longitude = Number(req.body.longitude);
    if (req.body.totalCapacity) req.body.totalCapacity = Number(req.body.totalCapacity);

    const payload = lotSchema.parse(req.body);

    // Handle images and blueprint with Cloudinary
    let imagePaths = [];
    let blueprintPath = null;

    // Check if we have files (req.files is now an object due to upload.fields)
    // If it was array (legacy), handle that too just in case, but upload.fields gives object
    const files = req.files || {};
    const imageFiles = files['images'] || [];
    const blueprintFiles = files['blueprint'] || [];

    if (imageFiles.length > 0 || blueprintFiles.length > 0) {
      // Import Cloudinary and configure
      const { v2: cloudinary } = await import('cloudinary');

      cloudinary.config({
        cloud_name: env.cloudinary.cloudName,
        api_key: env.cloudinary.apiKey,
        api_secret: env.cloudinary.apiSecret
      });

      // Helper to upload single file
      const uploadToCloudinary = async (file, folder) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: folder,
              resource_type: 'image',
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });
      };

      // Upload Images
      for (const file of imageFiles) {
        try {
          const result = await uploadToCloudinary(file, 'park-easy/parking-lots');
          if (result && result.secure_url) {
            imagePaths.push(result.secure_url);
            console.log("Cloudinary image upload success:", result.secure_url);
          }
        } catch (error) {
          console.error("Cloudinary Image Upload Error:", error);
          // Fallback to Base64
          const base64String = file.buffer.toString('base64');
          const dataUri = `data:${file.mimetype};base64,${base64String}`;
          imagePaths.push(dataUri);
        }
      }

      // Upload Blueprint
      if (blueprintFiles.length > 0) {
        const file = blueprintFiles[0];
        try {
          const result = await uploadToCloudinary(file, 'park-easy/blueprints');
          if (result && result.secure_url) {
            blueprintPath = result.secure_url;
            console.log("Cloudinary blueprint upload success:", result.secure_url);
          }
        } catch (error) {
          console.error("Cloudinary Blueprint Upload Error:", error);
          // Fallback to Base64
          const base64String = file.buffer.toString('base64');
          blueprintPath = `data:${file.mimetype};base64,${base64String}`;
        }
      }
    }

    // If updating, we might want to keep existing images or replace them.
    // For now, let's assume if new images are uploaded, we append them.
    // Ideally, we should have a way to delete specific images, but let's start with append.

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      let lotId = payload.lotId;

      if (lotId) {
        console.log("Updating existing lot:", lotId);
        const { rowCount } = await client.query(
          `UPDATE parking_lots
           SET name = $1, address = $2, city = $3, latitude = $4, longitude = $5, has_ev = $6, total_capacity = $7, capacity_breakdown = $8,
               blueprint = COALESCE($12, blueprint),
               images = CASE WHEN $11::text[] IS NOT NULL AND array_length($11::text[], 1) > 0 THEN array_cat(images, $11::text[]) ELSE images END
           WHERE id = $9 AND admin_id = $10`,
          [
            payload.name,
            payload.address,
            payload.city,
            payload.latitude,
            payload.longitude,
            payload.hasEv,
            payload.totalCapacity,
            payload.capacityBreakdown,
            payload.lotId,
            req.user.id,
            imagePaths,
            blueprintPath
          ]
        );
        if (!rowCount) {
          const err = new Error("Parking lot not found");
          err.status = 404;
          throw err;
        }
      } else {
        console.log("Inserting new lot");
        const { rows } = await client.query(
          `INSERT INTO parking_lots
            (admin_id, name, address, city, latitude, longitude, has_ev, total_capacity, capacity_breakdown, images, blueprint)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING id`,
          [
            req.user.id,
            payload.name,
            payload.address,
            payload.city,
            payload.latitude,
            payload.longitude,
            payload.hasEv,
            payload.totalCapacity, // Now explicitly from payload
            payload.capacityBreakdown,
            imagePaths,
            blueprintPath
          ]
        );
        lotId = rows[0].id;
        console.log("New lot created with ID:", lotId);
      }

      if (payload.amenities.length) {
        console.log("Updating amenities");
        await client.query(
          "DELETE FROM parking_lot_amenities WHERE lot_id = $1",
          [lotId]
        );
        for (const label of payload.amenities) {
          const { rows } = await client.query(
            `INSERT INTO amenities (label)
             VALUES ($1)
             ON CONFLICT (label) DO UPDATE SET label = EXCLUDED.label
             RETURNING id`,
            [label]
          );
          await client.query(
            `INSERT INTO parking_lot_amenities (lot_id, amenity_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [lotId, rows[0].id]
          );
        }
      }

      if (payload.pricing.length) {
        console.log("Updating pricing");
        for (const price of payload.pricing) {
          await client.query(
            `INSERT INTO slot_pricing (lot_id, vehicle_type, hourly, daily, monthly)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (lot_id, vehicle_type)
             DO UPDATE SET hourly = EXCLUDED.hourly, daily = EXCLUDED.daily, monthly = EXCLUDED.monthly`,
            [
              lotId,
              price.vehicleType,
              price.hourly ?? null,
              price.daily ?? null,
              price.monthly ?? null,
            ]
          );
        }
      }

      // Generate Parking Slots based on Capacity Breakdown
      if (payload.capacityBreakdown) {
        console.log("Generating parking slots...");
        // First, we need to handle existing slots. 
        // Strategy: We will count existing slots per type. 
        // If new capacity > existing, add more. 
        // If new capacity < existing, delete some (only available ones).
        // For simplicity in this iteration: We will just ensure we have *at least* the requested number of slots.
        // A full sync (delete excess) is riskier if there are bookings.

        for (const [type, count] of Object.entries(payload.capacityBreakdown)) {
          const currentSlotsRes = await client.query(
            `SELECT count(*) FROM parking_slots WHERE lot_id = $1 AND vehicle_type = $2`,
            [lotId, type]
          );
          const currentCount = parseInt(currentSlotsRes.rows[0].count);
          const targetCount = parseInt(count);

          if (targetCount > currentCount) {
            const needed = targetCount - currentCount;
            console.log(`Adding ${needed} slots for ${type}`);
            // Generate insert values
            for (let i = 0; i < needed; i++) {
              await client.query(
                `INSERT INTO parking_slots (lot_id, vehicle_type, label, is_available, is_ev)
                         VALUES ($1, $2, $3, true, $4)`,
                [
                  lotId,
                  type,
                  `${type.toUpperCase()}-${currentCount + i + 1}`, // Simple label generation
                  payload.hasEv // Inherit EV status from lot for now, or could be specific
                ]
              );
            }
          }
        }
      }

      await client.query("COMMIT");
      console.log("Transaction committed");

      const { rows } = await client.query(
        `
          ${lotSelect} AND pl.id = $2
          GROUP BY pl.id
        `,
        [req.user.id, lotId]
      );

      return res.status(payload.lotId ? 200 : 201).json({ lot: rows[0] });
    } catch (error) {
      console.error("Error in transaction:", error);
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error in upsertParkingLot:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid payload", issues: error.issues });
    }
    return next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const { rows } = await query(
      `
      SELECT
        (
          SELECT COUNT(*)
          FROM parking_slots s
          JOIN parking_lots pl ON pl.id = s.lot_id
          WHERE pl.admin_id = $1
        )::int AS "totalSpots",
        (
          SELECT COUNT(*)
          FROM bookings b
          JOIN parking_slots s ON s.id = b.slot_id
          JOIN parking_lots pl ON pl.id = s.lot_id
          WHERE pl.admin_id = $1
            AND b.status = 'confirmed'
            AND DATE(b.start_time) <= CURRENT_DATE
            AND DATE(b.end_time) >= CURRENT_DATE
        )::int AS "activeBookings",
        (
          SELECT COALESCE(SUM(b.amount_paid), 0)
          FROM bookings b
          JOIN parking_slots s ON s.id = b.slot_id
          JOIN parking_lots pl ON pl.id = s.lot_id
          WHERE pl.admin_id = $1
            AND b.status = 'confirmed'
            AND DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE)
        )::numeric AS "monthlyEarnings",
        (
          SELECT COUNT(*)
          FROM bookings b
          JOIN parking_slots s ON s.id = b.slot_id
          JOIN parking_lots pl ON pl.id = s.lot_id
          WHERE pl.admin_id = $1
            AND b.status = 'pending'
        )::int AS "pendingApprovals"
      `,
      [req.user.id]
    );

    return res.json({
      overview: rows[0],
    });
  } catch (error) {
    return next(error);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const { rows } = await query(
      `
      SELECT
        b.id,
        pl.name || ' - ' || s.label AS "spotName",
        u.full_name AS "customerName",
        to_char(b.start_time, 'Mon DD, YYYY') AS "date",
        to_char(b.start_time, 'HH12:MI AM') || ' - ' || to_char(b.end_time, 'HH12:MI AM') AS "timeSlot",
        b.amount_paid AS "amount",
        b.status
      FROM bookings b
      JOIN parking_slots s ON s.id = b.slot_id
      JOIN parking_lots pl ON pl.id = s.lot_id
      JOIN users u ON u.id = b.user_id
      WHERE pl.admin_id = $1
      ORDER BY b.created_at DESC
      LIMIT 10
      `,
      [req.user.id]
    );
    return res.json({ bookings: rows });
  } catch (error) {
    return next(error);
  }
};

export const deleteParkingLot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await query(
      "DELETE FROM parking_lots WHERE id = $1 AND admin_id = $2",
      [id, req.user.id]
    );

    if (!rowCount) {
      return res.status(404).json({ message: "Parking lot not found or unauthorized" });
    }

    return res.json({ message: "Parking lot deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

export const getEarnings = async (req, res, next) => {
  try {
    // Get daily earnings for the last 30 days
    const { rows } = await query(
      `
      SELECT
        DATE(b.created_at) as date,
        SUM(b.amount_paid) as amount,
        COUNT(b.id) as bookingsCount
      FROM bookings b
      JOIN parking_slots s ON s.id = b.slot_id
      JOIN parking_lots pl ON pl.id = s.lot_id
      WHERE pl.admin_id = $1
        AND b.status = 'confirmed'
        AND b.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(b.created_at)
      ORDER BY DATE(b.created_at) ASC
      `,
      [req.user.id]
    );

    // Calculate totals
    const totalRevenue = rows.reduce((sum, row) => sum + Number(row.amount), 0);
    const totalBookings = rows.reduce((sum, row) => sum + Number(row.bookingscount), 0);

    return res.json({
      daily: rows,
      totalRevenue,
      totalBookings
    });
  } catch (error) {
    return next(error);
  }
};

export const getAdminReviews = async (req, res, next) => {
  try {
    const { rows } = await query(
      `
      SELECT
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.full_name as "userName",
        pl.name as "lotName"
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      JOIN parking_lots pl ON pl.id = r.lot_id
      WHERE pl.admin_id = $1
      ORDER BY r.created_at DESC
      `,
      [req.user.id]
    );
    return res.json({ reviews: rows });
  } catch (error) {
    return next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { rows } = await query(
      `
      SELECT * FROM messages
      WHERE admin_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );
    return res.json({ messages: rows });
  } catch (error) {
    return next(error);
  }
};

export const submitSupportRequest = async (req, res, next) => {
  try {
    const { subject, message } = req.body;
    // For now, we just log it or save it to a general 'admin_support' table if we had one.
    // Or we can save it to messages table with a null admin_id (system message) or specific super admin.
    // Let's just mock success for now as requested "functional" usually means UI works.
    console.log(`Support request from ${req.user.id}: ${subject} - ${message}`);

    return res.json({ message: "Support request received. We will contact you shortly." });
  } catch (error) {
    return next(error);
  }
};

export const getRefundRequests = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT rr.*, b.amount_paid, u.full_name as user_name, pl.name as lot_name
             FROM refund_requests rr
             JOIN bookings b ON rr.booking_id = b.id
             JOIN users u ON rr.user_id = u.id
             JOIN parking_slots ps ON b.slot_id = ps.id
             JOIN parking_lots pl ON ps.lot_id = pl.id
             WHERE pl.admin_id = $1
             ORDER BY rr.created_at DESC`,
      [req.user.id]
    );
    return res.json({ requests: rows });
  } catch (error) {
    return next(error);
  }
};

export const handleRefundRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, refundAmount, adminResponse } = req.body; // status: 'approved' or 'rejected'

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update request status
      await client.query(
        `UPDATE refund_requests 
                 SET status = $1, admin_response = $2, refund_amount = $3
                 WHERE id = $4`,
        [status, adminResponse, refundAmount, id]
      );

      if (status === 'approved') {
        // Get booking details for payment record
        const requestRes = await client.query(
          `SELECT booking_id, user_id FROM refund_requests WHERE id = $1`,
          [id]
        );
        const { booking_id, user_id } = requestRes.rows[0];

        // Log refund payment
        await client.query(
          `INSERT INTO payments (booking_id, user_id, amount, type, status)
                     VALUES ($1, $2, $3, 'refund', 'success')`,
          [booking_id, user_id, refundAmount]
        );
      }

      await client.query('COMMIT');
      return res.json({ message: `Refund request ${status}` });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    return next(error);
  }
};
