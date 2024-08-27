import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";

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
  addGuide
);

router.route("/edit-guide/:id").patch(
  upload.fields([
    {
      name: "guideAvatar",
      maxCount: 1,
    },
  ]),
  editGuide
);

router.route("/remove-guide/:id").delete(deleteGuide);

router.get("/trekGuides", getAllGuides);

router.get("/trekGuides/:id", getGuideById); // Add this line to handle GET requests

export default router;
