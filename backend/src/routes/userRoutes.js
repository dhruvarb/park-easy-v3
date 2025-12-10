import { Router } from "express";
import {
  addFavorite,
  createBooking,
  listBookings,
  listFavorites,
  listSlots,
  getSlotDetails,
  removeFavorite,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  addReview,
  getReviews,
  getPaymentHistory,
  requestRefund,
} from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/slots", listSlots);
router.get("/slots/:id", getSlotDetails);
router.get("/slots/:id/reviews", getReviews);
router.use(requireAuth(["user", "admin"]));
router.get("/bookings", listBookings);
router.post("/bookings", createBooking);

router.get("/payments", getPaymentHistory);
router.post("/refunds", requestRefund);

router.get("/favorites", listFavorites);
router.post("/favorites", addFavorite);
router.delete("/favorites/:lotId", removeFavorite);

router.get("/notifications", listNotifications);
router.patch("/notifications/:id/read", markNotificationRead);
router.patch("/notifications/read-all", markAllNotificationsRead);
router.delete("/notifications/:id", deleteNotification);
router.delete("/notifications", clearAllNotifications);

router.post("/reviews", addReview);

export default router;
