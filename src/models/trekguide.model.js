import mongoose, { Schema } from "mongoose";

const trekGuideSchema = new Schema({
  name: { type: String, required: true },
  bio: { type: String },
  experience: { type: Number, required: true },
  images: [{ type: String }], // Array of image URLs
  instagramId: { type: String },
});

export const TrekGuide = mongoose.model("TrekGuide", trekGuideSchema);
