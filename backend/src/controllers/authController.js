import { z } from "zod";
import { query } from "../config/db.js";
import { hashPassword, comparePassword, signToken } from "../utils/security.js";

const signupSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(["user", "admin"]).default("user"),
  upiId: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const signup = async (req, res, next) => {
  try {
    const payload = signupSchema.parse(req.body);
    const existing = await query("SELECT id FROM users WHERE email = $1", [
      payload.email,
    ]);
    if (existing.rowCount) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await hashPassword(payload.password);

    // Start Transaction
    const client = await import("../config/db.js").then(m => m.default.connect());
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `INSERT INTO users (full_name, email, phone, role, password_hash, is_verified, upi_id, tokens)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 100)
         RETURNING id, role, full_name, email, is_verified, upi_id, tokens`,
        [
          payload.fullName,
          payload.email,
          payload.phone || null,
          payload.role,
          passwordHash,
          payload.role === "admin" ? false : true,
          payload.upiId || null,
        ]
      );

      const user = rows[0];

      // Log Welcome Bonus Transaction
      await client.query(
        `INSERT INTO token_transactions(user_id, amount, type, description)
         VALUES($1, 100, 'credit', 'Welcome Bonus')`,
        [user.id]
      );

      await client.query('COMMIT');

      const token = signToken({
        id: user.id,
        role: user.role,
        email: user.email,
      });

      return res.status(201).json({ token, user });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Signup error:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid payload", issues: error.issues });
    }
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const { rows } = await query(
      "SELECT id, role, full_name, email, password_hash, is_verified FROM users WHERE email = $1",
      [payload.email]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Account not found. Please sign up." });
    }

    const user = rows[0];
    const isValidPassword = await comparePassword(
      payload.password,
      user.password_hash
    );

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken({
      id: user.id,
      role: user.role,
      email: user.email,
    });
    delete user.password_hash;

    return res.json({ token, user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid payload", issues: error.issues });
    }
    return next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT id, role, full_name, email, phone, address, created_at, is_verified FROM users WHERE id = $1",
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ user: rows[0] });
  } catch (error) {
    return next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { upiId, fullName, phone, address } = req.body;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (upiId !== undefined) {
      updates.push(`upi_id = $${paramCount++}`);
      values.push(upiId);
    }
    if (fullName !== undefined) {
      updates.push(`full_name = $${paramCount++}`);
      values.push(fullName);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCount++}`);
      values.push(address);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(req.user.id);
    const queryText = `
      UPDATE users 
      SET ${updates.join(", ")} 
      WHERE id = $${paramCount} 
      RETURNING id, role, full_name, email, phone, address, upi_id, created_at, is_verified
    `;

    const { rows } = await query(queryText, values);

    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: rows[0] });
  } catch (error) {
    return next(error);
  }
};
