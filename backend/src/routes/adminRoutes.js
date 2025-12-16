import { Router } from "express";
import {
  getAnalytics,
  getParkingLots,
  upsertParkingLot,
  getBookings,
  deleteParkingLot,
  getEarnings,
  getAdminReviews,
  getMessages,
  submitSupportRequest,
  getRefundRequests,
  handleRefundRequest
} from "../controllers/adminController.js";
import { requireAuth } from "../middleware/auth.js";

import { upload } from "../config/upload.js";

const router = Router();

router.use(requireAuth(["admin"]));

router.get("/parking-lots", getParkingLots);
router.post("/parking-lots", upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'blueprint', maxCount: 1 }
]), upsertParkingLot);
router.get("/analytics/overview", getAnalytics);
router.get("/bookings", getBookings);
router.delete("/parking-lots/:id", deleteParkingLot);

router.get("/earnings", getEarnings);
router.get("/reviews", getAdminReviews);
router.get("/messages", getMessages);
router.post("/support", submitSupportRequest);
router.get("/refunds", getRefundRequests);
router.post("/refunds/:id/handle", handleRefundRequest);

export default router;
