import mongoose, { Schema } from "mongoose";

const testimonialSchema = new Schema({
  name: { type: String, required: true },
  trek: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  work: { type: String, required: true },

  comment: { type: String, required: true },
  images: [{ type: String, required: true }], // Array of image URLs
});

export const Testimonial = mongoose.model("Testimonial", testimonialSchema);
