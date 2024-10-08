import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Trek } from "../models/trek.model.js";
import { TrekDate } from "../models/Date.model.js";
import mongoose from "mongoose";

const getAllTreks = asyncHandler(async (req, res) => {
  try {
    const result = await Trek.aggregate([
      {
        $lookup: {
          from: "trektypes",
          localField: "trekType",
          foreignField: "_id",
          as: "trekTypeDetails",
        },
      },
      {
        $unwind: {
          path: "$trekTypeDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          trekName: 1,
          trekTitle: 1,
          suitableForAge: 1,
          altitude: 1,
          trekLocation: 1,
          trekDescription: 1,
          subDescription: 1,
          trekInfo: 1,
          trekHighlights: 1,
          trekInclusions: 1,
          trekExclusions: 1,
          trekCancellationPolicy: 1,
          trekDifficulty: 1,
          images: 1,
          dates: 1,
          trekTypeName: "$trekTypeDetails.name",
        },
      },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, result, "All Treks successfully fetched"));
  } catch (error) {
    console.error("Error fetching trek data for admin:", error);
    throw new ApiError(500, "An error occurred while fetching the trek data");
  }
});

const getTreksDetailsById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Trek.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) }, // Correctly instantiate ObjectId
      },
      {
        $lookup: {
          from: "trektypes",
          localField: "trekType",
          foreignField: "_id",
          as: "trekTypeDetails",
        },
      },
      { $unwind: "$trekTypeDetails" }, // Unwind as we expect one trekType per trek
      {
        $lookup: {
          from: "trekdates",
          localField: "dates",
          foreignField: "_id",
          as: "dateDetails",
        },
      },
      { $unwind: "$dateDetails" }, // Unwind as we expect one date per trek
      {
        $lookup: {
          from: "prices",
          localField: "dateDetails.price",
          foreignField: "_id",
          as: "priceDetails",
        },
      },
      { $unwind: "$priceDetails" }, // Unwind as we expect one price per date
      {
        $lookup: {
          from: "trektimelines",
          localField: "dateDetails.trekTimeline",
          foreignField: "_id",
          as: "trekTimelineDetails",
        },
      },
      { $unwind: "$trekTimelineDetails" }, // Unwind as we expect one timeline per trek
      {
        $project: {
          trekName: 1,
          trekTitle: 1,
          suitableForAge: 1,
          altitude: 1,
          trekLocation: 1,
          trekHighlights: 1,
          trekDescription: 1,
          subDescription: 1,
          trekInfo: 1,
          trekInclusions: 1,
          trekExclusions: 1,
          trekCancellationPolicy: 1,
          trekDifficulty: 1,
          images: 1,
          trekType: "$trekTypeDetails.name",
          trekTypeDescription: "$trekTypeDetails.description",
          startDate: "$dateDetails.startDate",
          endDate: "$dateDetails.endDate",
          price: "$priceDetails._id",
          withTravel: "$priceDetails.withTravel",
          withoutTravel: "$priceDetails.withoutTravel",
          scheduleTimeline: "$trekTimelineDetails.scheduleTimeline",
        },
      },
    ]);

    if (result.length === 0) {
      return res.status(404).json(new ApiError(404, "Trek not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, result[0], "Trek successfully fetched"));
  } catch (error) {
    console.error("Error fetching trek data:", error);
    throw new ApiError(500, "An error occurred while fetching the trek data");
  }
});

const getDatesForTrek = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const trek = await Trek.findById(id);

    if (!trek) {
      throw new ApiError(404, "Trek not found");
    }

    const result = await Trek.aggregate([
      {
        $match: { _id: trek._id },
      },
      {
        $lookup: {
          from: "trekdates",
          localField: "dates",
          foreignField: "_id",
          as: "trekDates",
        },
      },
      {
        $project: {
          "trekDates._id": 1,
          "trekDates.startDate": 1,
          "trekDates.endDate": 1,
        },
      },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Treks successfully fetched"));
  } catch (error) {
    console.error("Error fetching trek data for admin:", error);
    throw new ApiError(500, "An error occurred while fetching the trek data");
  }
});

const getDateDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const trekDate = await TrekDate.findById(id);

    if (!trekDate) {
      throw new ApiError(404, "TrekDate not found");
    }

    const result = await TrekDate.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: "trektimelines",
          localField: "trekTimeline",
          foreignField: "_id",
          as: "trekTimelineData",
        },
      },
      {
        $unwind: "$trekTimelineData",
      },
      {
        $lookup: {
          from: "prices",
          localField: "price",
          foreignField: "_id",
          as: "priceData",
        },
      },
      {
        $unwind: "$priceData",
      },
      {
        $project: {
          startDate: 1,
          endDate: 1,
          "trekTimelineData.scheduleTimeline": 1,
          "priceData.withTravel": 1,
          "priceData.withoutTravel": 1,
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(200, result, "TrekDate details successfully fetched")
      );
  } catch (error) {
    console.error("Error fetching trek date details:", error);
    throw new ApiError(
      500,
      "An error occurred while fetching the trek date details"
    );
  }
});

export { getAllTreks, getDatesForTrek, getDateDetails, getTreksDetailsById };
