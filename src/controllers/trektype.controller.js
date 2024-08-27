import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { TrekType } from "../models/trektype.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

const addTrekType = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if ([name, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const trekTypeImageLocalPath = req.files?.trekTypeImage[0]?.path;
  console.log("Local image path:", trekTypeImageLocalPath);

  if (!trekTypeImageLocalPath) {
    throw new ApiError(400, "Image File is Required");
  }

  const imageOnCloudinary = await uploadOnCloudinary(trekTypeImageLocalPath);
  console.log("Image uploaded to Cloudinary:", imageOnCloudinary);

  if (!imageOnCloudinary) {
    throw new ApiError(400, "Image File Didn't Upload");
  }

  const trekType = await TrekType.create({
    name,
    description,
    images: imageOnCloudinary.url,
  });

  if (!trekType) {
    throw new ApiError(500, "Something Went wrong while Adding Trek Type");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, trekType, "TrekType Created Successfully"));
});

const editTrekType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  console.log("Request body:", req.body);
  console.log("Uploaded files:", req.files);

  let imageOnCloudinary;

  // Check if a new image is uploaded
  if (req.files && req.files.trekTypeImage && req.files.trekTypeImage[0]) {
    const trekTypeImageLocalPath = req.files.trekTypeImage[0].path;
    console.log("Local image path:", trekTypeImageLocalPath);

    try {
      imageOnCloudinary = await uploadOnCloudinary(trekTypeImageLocalPath);
      console.log("Image uploaded to Cloudinary:", imageOnCloudinary);
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error);
      throw new ApiError(500, "Image upload failed");
    }

    if (!imageOnCloudinary) {
      throw new ApiError(500, "Image File Didn't Upload");
    }
  }

  // Fetch existing trek type data from database
  const existingTrekType = await TrekType.findById(id);
  if (!existingTrekType) {
    throw new ApiError(404, "Trek Type not found");
  }

  // Update trek type data
  existingTrekType.name = name;
  existingTrekType.description = description;

  // Set images field based on upload status
  if (imageOnCloudinary) {
    existingTrekType.images = imageOnCloudinary.url;
  }

  // Save updated trek type data
  const updatedTrekType = await existingTrekType.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedTrekType, "Trek Type Updated Successfully")
    );
});

const deleteTrekType = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await TrekType.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Guide Deleted Successfully"));
});

const getAllTrekTypesForHomePage = asyncHandler(async (req, res) => {
  try {
    const alltrektype = await TrekType.aggregate([
      {
        $project: {
          name: 1,
          description: 1,
          images: 1,
          _id: 1,
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(200, alltrektype, "Treks Name successfully fetched")
      );
  } catch (error) {
    console.error("Error fetching Treks Types data:", error);
    throw new ApiError(
      500,
      "An error occurred while fetching the Treks Types data"
    );
  }
});

const getTrekType = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const trektype = await TrekType.findById(id);

  if (!trektype) {
    throw new ApiError(404, `Trek Type with ID ${id} not found`);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, trektype, "Trek Type retrieved successfully"));
});

export {
  addTrekType,
  editTrekType,
  deleteTrekType,
  getAllTrekTypesForHomePage,
  getTrekType,
};
