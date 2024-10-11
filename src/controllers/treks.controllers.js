import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Trek } from "../models/trek.model.js";
import { TrekDate } from "../models/Date.model.js";
import { Price } from "../models/Price.model.js";
import { TrekTimeline } from "../models/TrekTimeline.model.js";
import mongoose from "mongoose";
import { TrekType } from "../models/trektype.model.js";

const addTrek = asyncHandler(async (req, res) => {
  const {
    trekName,
    trekTitle,
    trekDifficulty,
    suitableForAge,
    altitude,
    trekLocation,
    trekDescription,
    subDescription,
    trekInfo,
    trekHighlights,
    trekType,
    trekInclusions,
    trekExclusions,
    trekCancellationPolicy,
    startDate,
    endDate,
    withTravel, // Expecting an array of objects
    withoutTravel, // Expecting an array of objects
    scheduleTimeline, // Expecting an array of { day, time, work } objects
  } = req.body;

  console.log("req.body", req.body);

  // Safely handle the parsing of `withTravel` and `withoutTravel` arrays
  let travelWith = [];
  let travelWithout = [];

  try {
    travelWith = Array.isArray(withTravel)
      ? withTravel
      : typeof withTravel === "string"
        ? JSON.parse(withTravel)
        : [];

    travelWithout = Array.isArray(withoutTravel)
      ? withoutTravel
      : typeof withoutTravel === "string"
        ? JSON.parse(withoutTravel)
        : [];
  } catch (error) {
    console.error("Error parsing withTravel/withoutTravel:", error.message);
    return res.status(400).json({
      message: "Invalid format for withTravel or withoutTravel fields",
    });
  }

  // Debug logging
  console.log("Parsed withTravel:", travelWith);
  console.log("Parsed withoutTravel:", travelWithout);

  // Check if required images are present
  const trekImageLocalPaths = req.files?.trekImage?.map((file) => file.path);
  console.log("Local image paths:", trekImageLocalPaths);

  if (!trekImageLocalPaths || trekImageLocalPaths.length === 0) {
    return res
      .status(400)
      .json({ message: "At least one image file is required" });
  }

  try {
    // Upload images to Cloudinary
    const imageOnCloudinaryPromises =
      trekImageLocalPaths.map(uploadOnCloudinary);
    const imagesOnCloudinary = await Promise.all(imageOnCloudinaryPromises);
    console.log("Images uploaded to Cloudinary:", imagesOnCloudinary);

    if (!imagesOnCloudinary.every((image) => image)) {
      return res
        .status(400)
        .json({ message: "One or more image files didn't upload" });
    }

    // Create and save Price document
    const price = new Price({
      withTravel: travelWith,
      withoutTravel: travelWithout,
    });

    await price.save();
    console.log("Saved price:", price);

    // Ensure `scheduleTimeline` is an array
    let timelines = [];
    try {
      timelines = Array.isArray(scheduleTimeline)
        ? scheduleTimeline
        : typeof scheduleTimeline === "string"
          ? JSON.parse(scheduleTimeline)
          : [];
    } catch (error) {
      return res
        .status(400)
        .json({ message: "Invalid format for scheduleTimeline field" });
    }

    console.log("Timelines array to be saved:", timelines);

    // Create and save TrekTimeline document
    const trekTimeline = new TrekTimeline({
      scheduleTimeline: timelines,
    });
    await trekTimeline.save();
    console.log("Saved trekTimeline:", trekTimeline);

    // Create and save TrekDate document
    const trekDate = new TrekDate({
      startDate,
      endDate,
      trekTimeline: trekTimeline._id,
      price: price._id,
    });
    await trekDate.save();

    // Handle possible array/string format for fields
    const highlights = Array.isArray(trekHighlights)
      ? trekHighlights
      : JSON.parse(trekHighlights || "[]");
    const info = Array.isArray(trekInfo)
      ? trekInfo
      : JSON.parse(trekInfo || "[]");
    const inclusions = Array.isArray(trekInclusions)
      ? trekInclusions
      : JSON.parse(trekInclusions || "[]");
    const exclusions = Array.isArray(trekExclusions)
      ? trekExclusions
      : JSON.parse(trekExclusions || "[]");
    const cancellationPolicy = Array.isArray(trekCancellationPolicy)
      ? trekCancellationPolicy
      : JSON.parse(trekCancellationPolicy || "[]");
    const subDescriptionForTrek = Array.isArray(subDescription)
      ? subDescription
      : JSON.parse(subDescription || "[]");
    const difficulty = trekDifficulty.toLowerCase();

    // Create and save Trek document
    const newTrek = new Trek({
      trekName,
      trekTitle,
      suitableForAge,
      altitude,
      trekLocation,
      trekHighlights: highlights,
      trekDescription,
      subDescription: subDescriptionForTrek,
      trekType,
      trekInfo: info,
      trekInclusions: inclusions,
      trekExclusions: exclusions,
      trekCancellationPolicy: cancellationPolicy,
      trekDifficulty: difficulty,
      images: imagesOnCloudinary.map((image) => image.url), // Save uploaded image URLs
      dates: [trekDate._id],
      scheduleTimeline: trekTimeline._id, // Reference to the saved trekTimeline document
    });

    await newTrek.save();

    // Send a success response
    res.status(201).json({
      message: "Trek added successfully",
      data: newTrek,
    });
  } catch (error) {
    console.error("Error adding trek:", error.message);
    res.status(500).json({
      message: "An error occurred while adding the trek",
      error: error.message,
    });
  }
});

const addNewDateForTrek = asyncHandler(async (req, res) => {
  console.log("Request Body:", req.body);

  const { id } = req.params;

  // Destructure the input fields
  let {
    startDate,
    endDate,
    withTravel,
    withoutTravel,
    scheduleTimeline, // Expect this to be sent directly as an array
  } = req.body;

  // Initialize an array to collect validation errors
  const errors = [];

  // Validate date fields
  if (!startDate) errors.push("Start Date is missing");
  if (!endDate) errors.push("End Date is missing");
  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    errors.push("Start Date must be before End Date");
  }

  // Validate scheduleTimeline
  if (!Array.isArray(scheduleTimeline)) {
    errors.push("Schedule Timeline should be an array");
  } else if (scheduleTimeline.length === 0) {
    errors.push("Schedule Timeline is empty");
  } else {
    scheduleTimeline.forEach((timeline, index) => {
      if (!timeline.day) errors.push(`Day is missing at index ${index}`);
      if (!timeline.time) errors.push(`Time is missing at index ${index}`);
      if (!timeline.work) errors.push(`Work is missing at index ${index}`);
    });
  }

  // If there are validation errors, return a 400 Bad Request response
  if (errors.length > 0) {
    return res.status(400).json({
      statusCode: 400,
      message: "Validation failed",
      data: null,
      success: false,
      errors,
    });
  }

  // Start a MongoDB session and transaction
  const session = await Trek.startSession();
  session.startTransaction();

  try {
    // Create new Price document
    const price = new Price({
      withTravel: Array.isArray(withTravel) ? withTravel : [withTravel],
      withoutTravel: Array.isArray(withoutTravel)
        ? withoutTravel
        : [withoutTravel],
    });

    await price.save({ session });

    // Check if scheduleTimeline is an array and handle if it's a string
    let timelines = Array.isArray(scheduleTimeline) ? scheduleTimeline : [];

    if (typeof scheduleTimeline === "string") {
      try {
        timelines = JSON.parse(scheduleTimeline);
      } catch (error) {
        return res
          .status(400)
          .json({ message: "Invalid format for scheduleTimeline field" });
      }
    }

    console.log("Timelines array to be saved:", timelines);

    // Create and save TrekTimeline document
    const trekTimeline = new TrekTimeline({
      scheduleTimeline: timelines,
    });
    await trekTimeline.save({ session });
    console.log("Saved trekTimeline:", trekTimeline);

    // Create new TrekDate document
    const trekDate = new TrekDate({
      startDate: new Date(startDate), // Convert to Date object
      endDate: new Date(endDate), // Convert to Date object
      trekTimeline: trekTimeline._id,
      price: price._id,
    });

    await trekDate.save({ session });

    // Find the existing Trek document
    const existingTrek = await Trek.findById(id).session(session);
    if (!existingTrek) {
      await session.abortTransaction();
      return res.status(404).json({
        statusCode: 404,
        message: "Trek not found!",
        data: null,
        success: false,
        errors: [],
      });
    }

    // Update the Trek document with the new date
    existingTrek.dates.push(trekDate._id);
    await existingTrek.save({ session });

    await session.commitTransaction();
    res.status(201).json({
      statusCode: 201,
      message: "New trek date added successfully!",
      data: trekDate,
      success: true,
      errors: [],
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error adding new date for trek:", error.message);
    res.status(500).json({
      statusCode: 500,
      message: "An error occurred while adding the trek date.",
      data: null,
      success: false,
      errors: [error.message],
    });
  } finally {
    session.endSession(); // Always end the session
  }
});

const deleteTrek = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const session = await Trek.startSession();
  session.startTransaction();

  try {
    const existingTrek = await Trek.findById(id).session(session);
    if (!existingTrek) {
      return res.status(404).json({
        statusCode: {
          message: "Trek not Found!",
        },
        data: null,
        success: false,
        errors: [],
      });
    }

    const datesForTrek = existingTrek.dates;

    for (let i = 0; i < datesForTrek.length; i++) {
      const date = await TrekDate.findById(datesForTrek[i]).session(session);
      if (date) {
        // Delete the associated Price document
        await Price.findByIdAndDelete(date.price).session(session);

        // Delete each TrekTimeline document if it's an array
        const trekTimelines = Array.isArray(date.trekTimeline)
          ? date.trekTimeline
          : [date.trekTimeline];
        for (let j = 0; j < trekTimelines.length; j++) {
          await TrekTimeline.findByIdAndDelete(trekTimelines[j]).session(
            session
          );
        }

        // Delete the TrekDate document
        await TrekDate.findByIdAndDelete(date._id).session(session);
      }
    }

    // Finally, delete the Trek document
    await Trek.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      statusCode: {
        message: "Trek and its associated data deleted successfully!",
      },
      data: null,
      success: true,
      errors: [],
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting trek:", error.message);
    res.status(500).json({
      statusCode: {
        message: "An error occurred while deleting the trek",
      },
      data: null,
      success: false,
      errors: [error.message],
    });
  }
});

const patchTrek = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    trekName,
    trekTitle,
    trekDifficulty,
    suitableForAge,
    altitude,
    trekLocation,
    trekDescription,
    subDescription,
    trekInfo,
    trekHighlights,
    trekType,
    trekInclusions,
    trekExclusions,
    trekCancellationPolicy,
  } = req.body;

  const session = await Trek.startSession();
  session.startTransaction();

  try {
    // Find the existing trek by ID
    const trek = await Trek.findById(id).session(session);
    if (!trek) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        statusCode: 404,
        message: "Trek not found",
        data: null,
        success: false,
        errors: [],
      });
    }

    // Update fields if they are provided in the request
    if (trekName) trek.trekName = trekName;
    if (trekHighlights)
      trek.trekHighlights = Array.isArray(trekHighlights)
        ? trekHighlights
        : JSON.parse(trekHighlights);
    if (trekDescription) trek.trekDescription = trekDescription;

    if (subDescription)
      trek.subDescription = Array.isArray(subDescription)
        ? subDescription
        : JSON.parse(subDescription || "[]");

    if (trekInfo)
      trek.trekInfo = Array.isArray(trekInfo) ? trekInfo : JSON.parse(trekInfo);
    if (trekInclusions)
      trek.trekInclusions = Array.isArray(trekInclusions)
        ? trekInclusions
        : JSON.parse(trekInclusions);
    if (trekExclusions)
      trek.trekExclusions = Array.isArray(trekExclusions)
        ? trekExclusions
        : JSON.parse(trekExclusions);
    if (trekCancellationPolicy)
      trek.trekCancellationPolicy = Array.isArray(trekCancellationPolicy)
        ? trekCancellationPolicy
        : JSON.parse(trekCancellationPolicy);
    if (trekDifficulty) trek.trekDifficulty = trekDifficulty;

    // Convert trekType to ObjectId if it's provided
    if (trekType) {
      const objectIdTrekType = mongoose.Types.ObjectId.isValid(trekType)
        ? new mongoose.Types.ObjectId(trekType)
        : null;

      if (!objectIdTrekType) {
        throw new ApiError(400, "Invalid trekType provided");
      }

      trek.trekType = objectIdTrekType;
    }

    if (trekTitle) trek.trekTitle = trekTitle;
    if (suitableForAge) trek.suitableForAge = suitableForAge;
    if (altitude) trek.altitude = altitude;
    if (trekLocation) trek.trekLocation = trekLocation;

    // Handle image updates
    if (req.files?.trekImage) {
      const trekImageLocalPaths = req.files.trekImage.map((file) => file.path);

      // Upload images to Cloudinary
      const imageOnCloudinaryPromises =
        trekImageLocalPaths.map(uploadOnCloudinary);
      const imagesOnCloudinary = await Promise.all(imageOnCloudinaryPromises);

      if (imagesOnCloudinary.some((image) => !image)) {
        throw new ApiError(400, "One or more image files didn't upload");
      }

      // Update the images with the newly uploaded ones
      trek.images = imagesOnCloudinary.map((image) => image.url);
    }

    // Save the updated trek document
    await trek.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Send a success response
    res.status(200).json({
      statusCode: 200,
      message: "Trek updated successfully",
      data: trek,
      success: true,
      errors: [],
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error updating trek:", error.message);
    res.status(500).json({
      statusCode: 500,
      message: "An error occurred while updating the trek",
      data: null,
      success: false,
      errors: [error.message],
    });
  }
});

const patchDatesDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    startDate,
    endDate,
    withTravel, // Extracted directly from req.body
    withoutTravel, // Extracted directly from req.body
    scheduleTimeline,
  } = req.body;

  let travelWith = [];
  let travelWithout = [];

  // Parsing withTravel and withoutTravel to handle both array and JSON string formats
  try {
    travelWith = Array.isArray(withTravel)
      ? withTravel
      : typeof withTravel === "string"
        ? JSON.parse(withTravel)
        : [];

    travelWithout = Array.isArray(withoutTravel)
      ? withoutTravel
      : typeof withoutTravel === "string"
        ? JSON.parse(withoutTravel)
        : [];
  } catch (error) {
    console.error("Error parsing withTravel/withoutTravel:", error.message);
    return res.status(400).json({
      message: "Invalid format for withTravel or withoutTravel fields",
    });
  }

  // Start a MongoDB session and transaction
  const session = await TrekDate.startSession();
  session.startTransaction();

  try {
    // Fetch the existing TrekDate document by ID
    const trekDate = await TrekDate.findById(id).session(session);
    if (!trekDate) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        statusCode: 404,
        message: "TrekDate not found",
        data: null,
        success: false,
        errors: [],
      });
    }

    // Update startDate and endDate if provided
    if (startDate) trekDate.startDate = new Date(startDate);
    if (endDate) trekDate.endDate = new Date(endDate);

    // Fetch and update the Price document associated with the trek
    const price = await Price.findById(trekDate.price).session(session);
    if (!price) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        statusCode: 404,
        message: "Price document not found",
        data: null,
        success: false,
        errors: [],
      });
    }

    // Update the withTravel and withoutTravel details in the Price document
    if (travelWith.length) {
      price.withTravel = travelWith;
    }

    if (travelWithout.length) {
      price.withoutTravel = travelWithout;
    }

    // Fetch and update the TrekTimeline document associated with the trek
    const trekTimeline = await TrekTimeline.findById(
      trekDate.trekTimeline[0]
    ).session(session);
    if (!trekTimeline) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        statusCode: 404,
        message: "TrekTimeline document not found",
        data: null,
        success: false,
        errors: [],
      });
    }

    // Update scheduleTimeline if provided
    if (scheduleTimeline) {
      trekTimeline.scheduleTimeline = Array.isArray(scheduleTimeline)
        ? scheduleTimeline
        : JSON.parse(scheduleTimeline);
    }

    // Save the updated documents
    await price.save({ session });
    await trekTimeline.save({ session });
    await trekDate.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Return a success response
    res.status(200).json({
      statusCode: 200,
      message: "TrekDate details updated successfully",
      data: trekDate,
      success: true,
      errors: [],
    });
  } catch (error) {
    // Abort the transaction if there's an error
    await session.abortTransaction();
    session.endSession();
    console.error("Error updating TrekDate details:", error.message);
    res.status(500).json({
      statusCode: 500,
      message: "An error occurred while updating TrekDate details",
      data: null,
      success: false,
      errors: [error.message],
    });
  }
});

const deleteTrekDate = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const session = await TrekDate.startSession();
  session.startTransaction();

  try {
    // Find the existing TrekDate document by ID
    const trekDate = await TrekDate.findById(id).session(session);
    if (!trekDate) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        statusCode: 404,
        message: "TrekDate not found",
        data: null,
        success: false,
        errors: [],
      });
    }

    // Find the associated Trek document
    const trek = await Trek.findOne({ dates: id }).session(session);
    if (trek) {
      // Remove the TrekDate ID from the Trek's dates array
      trek.dates = trek.dates.filter((dateId) => dateId.toString() !== id);
      await trek.save({ session });
    }

    // Delete the associated Price document
    const price = await Price.findById(trekDate.price).session(session);
    if (price) {
      await Price.findByIdAndDelete(price._id).session(session);
    }

    // Delete each TrekTimeline document if it's an array
    const trekTimelines = Array.isArray(trekDate.trekTimeline)
      ? trekDate.trekTimeline
      : [trekDate.trekTimeline];
    for (let j = 0; j < trekTimelines.length; j++) {
      const trekTimeline = await TrekTimeline.findById(
        trekTimelines[j]
      ).session(session);
      if (trekTimeline) {
        await TrekTimeline.findByIdAndDelete(trekTimeline._id).session(session);
      }
    }

    // Delete the TrekDate document
    await TrekDate.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      statusCode: 200,
      message: "TrekDate and its associated data deleted successfully!",
      data: null,
      success: true,
      errors: [],
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting TrekDate:", error.message);
    res.status(500).json({
      statusCode: 500,
      message: "An error occurred while deleting TrekDate",
      data: null,
      success: false,
      errors: [error.message],
    });
  }
});

const aggregateTrekAllDetails = asyncHandler(async (req, res) => {
  try {
    const trekAllDetails = await Trek.aggregate([
      {
        $lookup: {
          from: "trektypes",
          localField: "trekType",
          foreignField: "_id",
          as: "trekTypeDetails",
        },
      },
      {
        $lookup: {
          from: "trekdates",
          localField: "dates",
          foreignField: "_id",
          as: "dateDetails",
        },
      },
      // {
      //   $unwind: {
      //     path: "$dateDetails",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      {
        $lookup: {
          from: "prices",
          localField: "dateDetails.price",
          foreignField: "_id",
          as: "priceDetails",
        },
      },
      // {
      //   $unwind: {
      //     path: "$priceDetails",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      {
        $lookup: {
          from: "trektimelines",
          localField: "dateDetails.trekTimeline",
          foreignField: "_id",
          as: "trekTimelineDetails",
        },
      },
      // {
      //   $unwind: {
      //     path: "$trekTimelineDetails",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      {
        $project: {
          trekName: 1,
          trekTitle: 1,
          suitableForAge: 1,
          altitude: 1,
          trekLocation: 1,
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
          // price: "$priceDetails._id",
          withTravel: "$priceDetails.withTravel",
          withoutTravel: "$priceDetails.withoutTravel",
          scheduleTimeline: "$trekTimelineDetails.scheduleTimeline",
        },
      },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, trekAllDetails, "Treks successfully fetched"));
  } catch (error) {
    console.error("Error fetching trek data for admin:", error);
    throw new ApiError(500, "An error occurred while fetching the trek data");
  }
});

const groupTreksByType = asyncHandler(async (req, res) => {
  try {
    const result = await Trek.aggregate([
      {
        $lookup: {
          from: "trekdates",
          localField: "dates",
          foreignField: "_id",
          as: "trekDates",
        },
      },
      {
        $unwind: "$trekDates",
      },
      {
        $lookup: {
          from: "prices",
          localField: "trekDates.price",
          foreignField: "_id",
          as: "priceDetails",
        },
      },
      {
        $unwind: "$priceDetails",
      },
      {
        $lookup: {
          from: "trektypes",
          localField: "trekType",
          foreignField: "_id",
          as: "trekTypeDetails",
        },
      },
      {
        $unwind: "$trekTypeDetails",
      },
      {
        $group: {
          _id: "$trekTypeDetails._id",
          treks: {
            $push: {
              trekId: "$_id",
              trekName: "$trekName",
              suitableForAge: "$suitableForAge",
              altitude: "$altitude",
              trekLocation: "$trekLocation",
              startDate: "$trekDates.startDate",
              endDate: "$trekDates.endDate",
              withTravel: "$priceDetails.withTravel",
              withoutTravel: "$priceDetails.withoutTravel",
              trekTypeName: "$trekTypeDetails.name",
              trekDifficulty: "$trekDifficulty",
            },
          },
        },
      },
      {
        $project: {
          _id: 0, // Exclude the default _id field
          trekTypeId: "$_id",
          trekTypeName: { $arrayElemAt: ["$treks.trekTypeName", 0] },
          treks: 1,
        },
      },
    ]);

    // Send the response using res.json
    res.json({
      statusCode: 200,
      data: result,
      message: "Treks grouped by type successfully fetched",
      success: true,
    });
  } catch (error) {
    console.error("Error in grouping treks by type:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      success: false,
    });
  }
});

// ! Main Slider Route
const aggregateTrekAllDetailsForSliderHome = asyncHandler(async (req, res) => {
  try {
    const trekAllDetails = await Trek.aggregate([
      {
        $lookup: {
          from: "trektypes",
          localField: "trekType",
          foreignField: "_id",
          as: "trekTypeDetails",
        },
      },
      {
        $lookup: {
          from: "trekdates",
          localField: "dates",
          foreignField: "_id",
          as: "dateDetails",
        },
      },
      {
        $unwind: {
          path: "$dateDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "prices",
          localField: "dateDetails.price",
          foreignField: "_id",
          as: "priceDetails",
        },
      },
      {
        $unwind: {
          path: "$priceDetails",
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
          trekDifficulty: 1,
          images: 1,
          dates: 1,

          trekType: { $arrayElemAt: ["$trekTypeDetails.name", 0] }, // Handle array
          startDate: "$dateDetails.startDate",
          dateDifference: {
            $divide: [
              { $subtract: ["$dateDetails.endDate", "$dateDetails.startDate"] },
              1000 * 60 * 60 * 24, // Convert milliseconds to days
            ],
          },
        },
      },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, trekAllDetails, "Treks successfully fetched"));
  } catch (error) {
    console.error("Error fetching trek data for admin:", error);
    throw new ApiError(500, "An error occurred while fetching the trek data");
  }
});

const aggregateTrekAllDetailsForSliderHomeSortByDateInAsc = asyncHandler(
  async (req, res) => {
    try {
      const trekAllDetails = await Trek.aggregate([
        {
          $lookup: {
            from: "trektypes",
            localField: "trekType",
            foreignField: "_id",
            as: "trekTypeDetails",
          },
        },
        {
          $lookup: {
            from: "trekdates",
            localField: "dates",
            foreignField: "_id",
            as: "dateDetails",
          },
        },
        {
          $unwind: {
            path: "$dateDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "prices",
            localField: "dateDetails.price",
            foreignField: "_id",
            as: "priceDetails",
          },
        },
        {
          $unwind: {
            path: "$priceDetails",
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
            trekDifficulty: 1,
            images: 1,
            dates: 1,
            trekType: { $arrayElemAt: ["$trekTypeDetails.name", 0] }, // Handle array

            // Create a nested object for startDate and _id
            startDate: "$dateDetails.startDate",
            trekDateId: "$dateDetails._id",

            dateDifference: {
              $divide: [
                {
                  $subtract: ["$dateDetails.endDate", "$dateDetails.startDate"],
                },
                1000 * 60 * 60 * 24, // Convert milliseconds to days
              ],
            },
          },
        },
        {
          $sort: {
            startDate: 1, // Sort by startDate in ascending order
          },
        },
      ]);

      return res
        .status(200)
        .json(
          new ApiResponse(200, trekAllDetails, "Treks successfully fetched")
        );
    } catch (error) {
      console.error("Error fetching trek data:", error);
      throw new ApiError(500, "An error occurred while fetching the trek data");
    }
  }
);

const aggregateTrekAllDetailsForSliderHomeSortByDateInDesc = asyncHandler(
  async (req, res) => {
    try {
      const trekAllDetails = await Trek.aggregate([
        {
          $lookup: {
            from: "trektypes",
            localField: "trekType",
            foreignField: "_id",
            as: "trekTypeDetails",
          },
        },
        {
          $lookup: {
            from: "trekdates",
            localField: "dates",
            foreignField: "_id",
            as: "dateDetails",
          },
        },
        {
          $unwind: {
            path: "$dateDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "prices",
            localField: "dateDetails.price",
            foreignField: "_id",
            as: "priceDetails",
          },
        },
        {
          $unwind: {
            path: "$priceDetails",
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
            trekDifficulty: 1,
            images: 1,
            dates: 1,

            trekType: { $arrayElemAt: ["$trekTypeDetails.name", 0] }, // Handle array
            startDate: "$dateDetails.startDate",
            trekDateId: "$dateDetails._id",

            dateDifference: {
              $abs: {
                $divide: [
                  {
                    $subtract: [
                      "$dateDetails.endDate",
                      "$dateDetails.startDate",
                    ],
                  },
                  1000 * 60 * 60 * 24, // Convert milliseconds to days
                ],
              },
            },
          },
        },
        {
          $sort: {
            startDate: -1, // Sort by startDate in descending order
          },
        },
      ]);

      return res
        .status(200)
        .json(
          new ApiResponse(200, trekAllDetails, "Treks successfully fetched")
        );
    } catch (error) {
      console.error("Error fetching trek data for admin:", error);
      throw new ApiError(500, "An error occurred while fetching the trek data");
    }
  }
);

const aggregateTrekAllDetailsForSliderHomeSortByPriceInDesc = asyncHandler(
  async (req, res) => {
    try {
      const trekAllDetails = await Trek.aggregate([
        {
          $lookup: {
            from: "trektypes",
            localField: "trekType",
            foreignField: "_id",
            as: "trekTypeDetails",
          },
        },
        {
          $lookup: {
            from: "trekdates",
            localField: "dates",
            foreignField: "_id",
            as: "dateDetails",
          },
        },
        {
          $unwind: {
            path: "$dateDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "prices",
            localField: "dateDetails.price",
            foreignField: "_id",
            as: "priceDetails",
          },
        },
        {
          $unwind: {
            path: "$priceDetails",
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
            trekDifficulty: 1,
            images: 1,
            dates: 1,

            trekType: { $arrayElemAt: ["$trekTypeDetails.name", 0] }, // Handle array
            startDate: "$dateDetails.startDate",
            trekDateId: "$dateDetails._id",

            dateDifference: {
              $abs: {
                $divide: [
                  {
                    $subtract: [
                      "$dateDetails.endDate",
                      "$dateDetails.startDate",
                    ],
                  },
                  1000 * 60 * 60 * 24, // Convert milliseconds to days
                ],
              },
            },
            price: {
              $cond: {
                if: { $gt: ["$priceDetails.withTravel.price", 0] },
                then: "$priceDetails.withTravel.price",
                else: { $ifNull: ["$priceDetails.withoutTravel.price", 0] },
              },
            }, // Use `withTravel` price if available, otherwise fallback to `withoutTravel` price
          },
        },
        {
          $sort: {
            price: -1, // Sort by price in descending order
          },
        },
      ]);

      return res
        .status(200)
        .json(
          new ApiResponse(200, trekAllDetails, "Treks successfully fetched")
        );
    } catch (error) {
      console.error("Error fetching trek data for admin:", error);
      throw new ApiError(500, "An error occurred while fetching the trek data");
    }
  }
);

const aggregateTrekAllDetailsForSliderHomeSortByPriceInAsc = asyncHandler(
  async (req, res) => {
    try {
      const trekAllDetails = await Trek.aggregate([
        {
          $lookup: {
            from: "trektypes",
            localField: "trekType",
            foreignField: "_id",
            as: "trekTypeDetails",
          },
        },
        {
          $lookup: {
            from: "trekdates",
            localField: "dates",
            foreignField: "_id",
            as: "dateDetails",
          },
        },
        {
          $unwind: {
            path: "$dateDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "prices",
            localField: "dateDetails.price",
            foreignField: "_id",
            as: "priceDetails",
          },
        },
        {
          $unwind: {
            path: "$priceDetails",
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
            trekDifficulty: 1,
            images: 1,

            dates: 1,
            trekType: { $arrayElemAt: ["$trekTypeDetails.name", 0] }, // Handle array
            startDate: "$dateDetails.startDate",
            trekDateId: "$dateDetails._id",

            dateDifference: {
              $abs: {
                $divide: [
                  {
                    $subtract: [
                      "$dateDetails.endDate",
                      "$dateDetails.startDate",
                    ],
                  },
                  1000 * 60 * 60 * 24, // Convert milliseconds to days
                ],
              },
            },
            price: {
              $cond: {
                if: { $gt: ["$priceDetails.withTravel.price", 0] },
                then: "$priceDetails.withTravel.price",
                else: { $ifNull: ["$priceDetails.withoutTravel.price", 0] },
              },
            }, // Use `withTravel` price if available, otherwise fallback to `withoutTravel` price
          },
        },
        {
          $sort: {
            price: 1,
          },
        },
      ]);

      return res
        .status(200)
        .json(
          new ApiResponse(200, trekAllDetails, "Treks successfully fetched")
        );
    } catch (error) {
      console.error("Error fetching trek data for admin:", error);
      throw new ApiError(500, "An error occurred while fetching the trek data");
    }
  }
);

const aggregateTrekEasyDifficultyForSliderHome = asyncHandler(
  async (req, res) => {
    try {
      const trekAllDetails = await Trek.aggregate([
        {
          $lookup: {
            from: "trektypes",
            localField: "trekType",
            foreignField: "_id",
            as: "trekTypeDetails",
          },
        },
        {
          $lookup: {
            from: "trekdates",
            localField: "dates",
            foreignField: "_id",
            as: "dateDetails",
          },
        },
        {
          $unwind: {
            path: "$dateDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "prices",
            localField: "dateDetails.price",
            foreignField: "_id",
            as: "priceDetails",
          },
        },
        {
          $unwind: {
            path: "$priceDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            trekDifficulty: "easy", // Filter for easy difficulty
          },
        },
        {
          $project: {
            trekName: 1,
            trekTitle: 1,
            suitableForAge: 1,
            altitude: 1,
            trekLocation: 1,
            trekDifficulty: 1,
            images: 1,
            dates: 1,
            trekType: { $arrayElemAt: ["$trekTypeDetails.name", 0] }, // Handle array
            startDate: "$dateDetails.startDate",
            trekDateId: "$dateDetails._id",

            dateDifference: {
              $divide: [
                {
                  $subtract: ["$dateDetails.endDate", "$dateDetails.startDate"],
                },
                1000 * 60 * 60 * 24, // Convert milliseconds to days
              ],
            },
          },
        },
      ]);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            trekAllDetails,
            "Treks with easy difficulty successfully fetched"
          )
        );
    } catch (error) {
      console.error("Error fetching easy difficulty trek data:", error);
      throw new ApiError(
        500,
        "An error occurred while fetching the easy difficulty trek data"
      );
    }
  }
);

const aggregateTrekModrateDifficultyForSliderHome = asyncHandler(
  async (req, res) => {
    try {
      const trekAllDetails = await Trek.aggregate([
        {
          $lookup: {
            from: "trektypes",
            localField: "trekType",
            foreignField: "_id",
            as: "trekTypeDetails",
          },
        },
        {
          $lookup: {
            from: "trekdates",
            localField: "dates",
            foreignField: "_id",
            as: "dateDetails",
          },
        },
        {
          $unwind: {
            path: "$dateDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "prices",
            localField: "dateDetails.price",
            foreignField: "_id",
            as: "priceDetails",
          },
        },
        {
          $unwind: {
            path: "$priceDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            trekDifficulty: "moderate", // Filter for easy difficulty
          },
        },
        {
          $project: {
            trekName: 1,
            trekTitle: 1,
            suitableForAge: 1,
            altitude: 1,
            trekLocation: 1,
            trekDifficulty: 1,
            images: 1,
            dates: 1,
            trekType: { $arrayElemAt: ["$trekTypeDetails.name", 0] }, // Handle array
            startDate: "$dateDetails.startDate",
            trekDateId: "$dateDetails._id",

            dateDifference: {
              $divide: [
                {
                  $subtract: ["$dateDetails.endDate", "$dateDetails.startDate"],
                },
                1000 * 60 * 60 * 24, // Convert milliseconds to days
              ],
            },
          },
        },
      ]);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            trekAllDetails,
            "Treks with easy difficulty successfully fetched"
          )
        );
    } catch (error) {
      console.error("Error fetching easy difficulty trek data:", error);
      throw new ApiError(
        500,
        "An error occurred while fetching the easy difficulty trek data"
      );
    }
  }
);

const aggregateTrekDifficultDifficultyForSliderHome = asyncHandler(
  async (req, res) => {
    try {
      const trekAllDetails = await Trek.aggregate([
        {
          $lookup: {
            from: "trektypes",
            localField: "trekType",
            foreignField: "_id",
            as: "trekTypeDetails",
          },
        },
        {
          $lookup: {
            from: "trekdates",
            localField: "dates",
            foreignField: "_id",
            as: "dateDetails",
          },
        },
        {
          $unwind: {
            path: "$dateDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "prices",
            localField: "dateDetails.price",
            foreignField: "_id",
            as: "priceDetails",
          },
        },
        {
          $unwind: {
            path: "$priceDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            trekDifficulty: "difficult", // Filter for easy difficulty
          },
        },
        {
          $project: {
            trekName: 1,
            trekTitle: 1,
            suitableForAge: 1,
            altitude: 1,
            trekLocation: 1,
            trekDifficulty: 1,
            images: 1,
            dates: 1,
            trekType: { $arrayElemAt: ["$trekTypeDetails.name", 0] }, // Handle array
            startDate: "$dateDetails.startDate",
            trekDateId: "$dateDetails._id",

            dateDifference: {
              $divide: [
                {
                  $subtract: ["$dateDetails.endDate", "$dateDetails.startDate"],
                },
                1000 * 60 * 60 * 24, // Convert milliseconds to days
              ],
            },
          },
        },
      ]);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            trekAllDetails,
            "Treks with easy difficulty successfully fetched"
          )
        );
    } catch (error) {
      console.error("Error fetching easy difficulty trek data:", error);
      throw new ApiError(
        500,
        "An error occurred while fetching the easy difficulty trek data"
      );
    }
  }
);

const getAllTreksForHomePage = asyncHandler(async (req, res) => {
  try {
    const trekAllDetails = await Trek.aggregate([
      {
        $project: {
          trekName: 1,
          dates: 1,
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(200, trekAllDetails, "Treks Name successfully fetched")
      );
  } catch (error) {
    console.error("Error fetching Treks Name data:", error);
    throw new ApiError(
      500,
      "An error occurred while fetching the Treks Name data"
    );
  }
});

const aggregateTrekTypeForSliderHome = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid ID format");
  }

  try {
    // console.log("Tried");

    // Simplified aggregation pipeline for debugging
    const trekAllDetails = await Trek.aggregate([
      {
        $match: { trekType: new mongoose.Types.ObjectId(id) }, // Match treks by trekType ID
      },
      {
        $lookup: {
          from: "trektypes",
          localField: "trekType",
          foreignField: "_id",
          as: "trekTypeDetails",
        },
      },
      {
        $unwind: "$trekTypeDetails", // Ensure trekTypeDetails is not an array
      },
      {
        $lookup: {
          from: "trekdates",
          localField: "dates",
          foreignField: "_id",
          as: "dateDetails",
        },
      },
      {
        $unwind: "$dateDetails", // Unwind dateDetails to simplify access to nested fields
      },
      {
        $lookup: {
          from: "prices",
          localField: "dateDetails.price",
          foreignField: "_id",
          as: "priceDetails",
        },
      },
      {
        $project: {
          trekName: 1,
          trekTitle: 1,
          suitableForAge: 1,
          altitude: 1,
          trekLocation: 1,
          trekDifficulty: 1,
          images: 1,
          dates: 1,
          trekType: "$trekTypeDetails.name", // Directly reference name
          startDate: "$dateDetails.startDate",
          trekDateId: "$dateDetails._id",
          dateDifference: {
            $divide: [
              {
                $subtract: ["$dateDetails.endDate", "$dateDetails.startDate"],
              },
              1000 * 60 * 60 * 24, // Convert milliseconds to days
            ],
          },
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          trekAllDetails,
          "Trek Types Treks successfully fetched"
        )
      );
  } catch (error) {
    console.error("Error fetching Trek Types trek data:", {
      message: error.message,
      stack: error.stack,
    });
    throw new ApiError(
      500,
      "An error occurred while fetching the Trek Types trek data"
    );
  }
});

const aggregateTrekMainPageTrekData = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid ID format");
  }

  try {
    const trekAllDetails = await Trek.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) }, // Match trek by ID
      },
      {
        $lookup: {
          from: "trektypes",
          localField: "trekType",
          foreignField: "_id",
          as: "trekTypeDetails",
        },
      },
      // {
      //   $unwind: "$trekTypeDetails", // Ensure single object
      // },
      {
        $lookup: {
          from: "trekdates",
          localField: "dates",
          foreignField: "_id",
          as: "dateDetails",
        },
      },
      // {
      //   $unwind: "$dateDetails", // Ensure single object
      // },
      {
        $lookup: {
          from: "prices",
          localField: "dateDetails.price",
          foreignField: "_id",
          as: "priceDetails",
        },
      },
      // {
      //   $unwind: "$priceDetails", // Ensure single object
      // },
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
          allStartDate: {
            dateid: "$dateDetails._id",
            date: "$dateDetails.startDate",
            withTravel: "$priceDetails.withTravel.price",
            withoutTravel: "$priceDetails.withoutTravel.price",
          },
          allEndDate: "$dateDetails.endDate",
          withTravel: "$priceDetails.withTravel",
          withoutTravel: "$priceDetails.withoutTravel",
        },
      },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, trekAllDetails, "Treks successfully fetched"));
  } catch (error) {
    console.error("Error fetching trek data for admin:", error);
    throw new ApiError(500, "An error occurred while fetching the trek data");
  }
});

const aggregateTrekMainPageTrekDatesInfo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid ID format");
  }

  try {
    const trekAllDetails = await TrekDate.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) }, // Match by the given trek date ID
      },
      {
        $lookup: {
          from: "prices",
          localField: "price", // Look up price details based on the price field in the DateSchema
          foreignField: "_id",
          as: "priceDetails",
        },
      },
      {
        $unwind: {
          path: "$priceDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "trektimelines",
          localField: "trekTimeline", // Look up trek timeline details based on the trekTimeline field in the DateSchema
          foreignField: "_id",
          as: "trekTimelineDetails",
        },
      },
      {
        $unwind: {
          path: "$trekTimelineDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          startDate: 1,
          endDate: 1,
          "priceDetails.withTravel": 1,
          "priceDetails.withoutTravel": 1,
          "trekTimelineDetails.scheduleTimeline": 1,
          dateDifference: {
            $divide: [
              { $subtract: ["$endDate", "$startDate"] }, // Subtract startDate from endDate
              1000 * 60 * 60 * 24, // Convert milliseconds to days
            ],
          },
        },
      },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, trekAllDetails, "Treks successfully fetched"));
  } catch (error) {
    console.error("Error fetching trek data for main page:", error.message);
    throw new ApiError(500, "An error occurred while fetching the trek data");
  }
});

export {
  //! Main Slider Functions End
  aggregateTrekAllDetailsForSliderHome,
  aggregateTrekAllDetailsForSliderHomeSortByDateInAsc,
  aggregateTrekAllDetailsForSliderHomeSortByDateInDesc,
  aggregateTrekAllDetailsForSliderHomeSortByPriceInDesc,
  aggregateTrekAllDetailsForSliderHomeSortByPriceInAsc,
  aggregateTrekEasyDifficultyForSliderHome,
  aggregateTrekModrateDifficultyForSliderHome,
  aggregateTrekDifficultDifficultyForSliderHome,
  getAllTreksForHomePage,
  aggregateTrekTypeForSliderHome,
  //! Main Slider Functions End
  //! Trek Main PageStart
  aggregateTrekMainPageTrekData,
  aggregateTrekMainPageTrekDatesInfo,
  //! Trek Main Page End
  addTrek,
  addNewDateForTrek,
  deleteTrek,
  patchTrek,
  patchDatesDetails,
  deleteTrekDate,
  aggregateTrekAllDetails,
  groupTreksByType,
};
