import mongoose, { Schema } from "mongoose";

const PriceSchema = new Schema({
  withTravel: [
    {
      description: { type: String, required: true }, // Changed to true
      from: { type: String, required: true }, // Changed to true
      to: { type: String, required: true }, // Changed to true
      price: { type: Number, required: true }, // Changed to true
    },
  ],
  withoutTravel: [
    {
      description: { type: String, required: true }, // Changed to true
      from: { type: String, required: true }, // Changed to true
      to: { type: String, required: true }, // Changed to true
      price: { type: Number, required: true }, // Changed to true
    },
  ],
});

export const Price = mongoose.model("Price", PriceSchema);
