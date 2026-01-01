import { Router } from "express";
import { login, me, signup, updateProfile, forgotPassword, resetPassword } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", requireAuth(), me);
router.patch("/me", requireAuth(), updateProfile);

export default router;
