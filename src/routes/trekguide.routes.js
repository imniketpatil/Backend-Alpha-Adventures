import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";

import { verifyJWT } from "../middlewares/auth.middleaware.js";
import {
  addGuide,
  editGuide,
  deleteGuide,
  getAllGuides,
  getGuideById,
} from "../controllers/trekguide.controller.js";
const router = Router();

router.route("/add-guide").post(
  upload.fields([
    {
      name: "guideAvatar",
      maxCount: 1,
    },
  ]),
  verifyJWT,
  addGuide
);

router.route("/edit-guide/:id").patch(
  upload.fields([
    {
      name: "guideAvatar",
      maxCount: 1,
    },
  ]),
  verifyJWT,
  editGuide
);

router.route("/remove-guide/:id").delete(verifyJWT, deleteGuide);

router.get("/trekGuides", verifyJWT, getAllGuides);

router.get("/trekGuides/:id", verifyJWT, getGuideById); // Add this line to handle GET requests

export default router;
