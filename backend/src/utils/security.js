import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import env from "../config/env.js";

export const hashPassword = async (plain) => bcrypt.hash(plain, 10);

export const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);

export const signToken = (payload) =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: `${env.tokenTtlHours}h` });

export const verifyToken = (token) => jwt.verify(token, env.jwtSecret);
