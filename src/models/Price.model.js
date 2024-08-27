import mongoose, { Schema } from "mongoose";

const PriceSchema = new Schema({
  withTravel: {
    description: { type: String, required: false },
    from: { type: String, required: false },
    to: { type: String, required: false },
    price: { type: Number, required: false },
  },
  withoutTravel: {
    description: { type: String, required: false },
    from: { type: String, required: false },
    to: { type: String, required: false },
    price: { type: Number, required: false },
  },
});

export const Price = mongoose.model("Price", PriceSchema);
