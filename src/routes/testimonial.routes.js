import { Router } from "express";
import {
  createTestimonial,
  deleteTestimonial,
  getAllTestimonial,
  getAllTestimonials,
  updateTestimonialDetails,
} from "../controllers/testimonial.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/create-testimonial").post(
  upload.fields([
    {
      name: "testimonialAvatar",
      maxCount: 1,
    },
  ]),
  createTestimonial
);

router.route("/edit-testimonial/:id").patch(
  upload.fields([
    {
      name: "testimonialAvatar",
      maxCount: 1,
    },
  ]),
  updateTestimonialDetails
);

router.route("/this_testimonial/:id").delete(deleteTestimonial);

router.route("/getAllTestimonials").get(getAllTestimonials);

router.route("/getAllTestimonial/:id").get(getAllTestimonial);

export default router;
