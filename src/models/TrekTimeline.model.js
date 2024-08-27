import mongoose, { Schema } from "mongoose";

const TrekTimelineSchema = new Schema({
  scheduleTimeline: [
    {
      day: { type: String, required: true },
      time: { type: String, required: true },
      work: { type: String, required: true },
    },
  ],
});

export const TrekTimeline = mongoose.model("TrekTimeline", TrekTimelineSchema);
