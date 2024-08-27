import mongoose, { Schema } from "mongoose";

const trekTypeSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  images: [{ type: String }], // Array of image URLs
});

export const TrekType = mongoose.model("TrekType", trekTypeSchema);
