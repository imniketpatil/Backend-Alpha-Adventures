import mongoose from "mongoose";
const { Schema } = mongoose;

const TrekSchema = new Schema({
  trekName: { type: String, required: false },
  trekType: { type: Schema.Types.ObjectId, ref: "TrekType", required: false },
  trekTitle: { type: String, required: false },
  suitableForAge: { type: String, required: false },
  altitude: { type: Number, required: false },
  trekLocation: { type: String, required: false },
  trekDescription: { type: String, required: false },
  trekInfo: [{ type: String, required: false }],
  trekHighlights: [{ type: String, required: false }],
  trekInclusions: [{ type: String, required: false }],
  trekExclusions: [{ type: String, required: false }],
  trekCancellationPolicy: [{ type: String, required: false }],
  trekDifficulty: {
    type: String,
    enum: ["easy", "moderate", "difficult"],
    required: false,
  },
  images: [{ type: String, required: false }],
  dates: [{ type: Schema.Types.ObjectId, ref: "TrekDate", required: false }],
});

export const Trek = mongoose.model("Trek", TrekSchema);
