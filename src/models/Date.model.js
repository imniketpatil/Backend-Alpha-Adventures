import mongoose, { Schema } from "mongoose";

const DateSchema = new Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  trekTimeline: [
    { type: Schema.Types.ObjectId, ref: "TrekTimeline", required: true },
  ],
  price: { type: Schema.Types.ObjectId, ref: "Price", required: true },
});

export const TrekDate = mongoose.model("TrekDate", DateSchema);
