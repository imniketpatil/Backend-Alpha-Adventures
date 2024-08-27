import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { TrekGuide } from "../models/trekguide.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const addGuide = asyncHandler(async (req, res) => {
  const { name, bio, experience, instagramId } = req.body;

  if (
    [name, bio, experience, instagramId].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const guideImageLocalPath = req.files?.guideAvatar[0]?.path;
  console.log("Local image path:", guideImageLocalPath);

  if (!guideImageLocalPath) {
    throw new ApiError(400, "Image File is Required");
  }

  const imageOnCloudinary = await uploadOnCloudinary(guideImageLocalPath);
  console.log("Image uploaded to Cloudinary:", imageOnCloudinary);

  if (!imageOnCloudinary) {
    throw new ApiError(400, "Image File Didn't Upload");
  }

  const guide = await TrekGuide.create({
    name,
    bio,
    experience,
    instagramId,
    images: imageOnCloudinary.url,
  });

  if (!guide) {
    throw new ApiError(500, "Something Went wrong while Adding Guide");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, guide, "Guide Created Successfully"));
});

const editGuide = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, bio, experience, instagramId } = req.body;

  console.log("Request body:", req.body);
  console.log("Uploaded files:", req.files);

  let imageOnCloudinary;

  // Check if a new image is uploaded
  if (req.files && req.files.guideAvatar && req.files.guideAvatar[0]) {
    const guideImageLocalPath = req.files.guideAvatar[0].path;
    console.log("Local image path:", guideImageLocalPath);

    try {
      imageOnCloudinary = await uploadOnCloudinary(guideImageLocalPath);
      console.log("Image uploaded to Cloudinary:", imageOnCloudinary);
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error);
      throw new ApiError(500, "Image upload failed");
    }

    if (!imageOnCloudinary) {
      throw new ApiError(500, "Image File Didn't Upload");
    }
  }

  // Fetch existing guide data from database
  const existingGuide = await TrekGuide.findById(id);
  if (!existingGuide) {
    throw new ApiError(404, "Guide not found");
  }

  // Update guide data
  existingGuide.name = name;
  existingGuide.bio = bio;
  existingGuide.experience = experience;
  existingGuide.instagramId = instagramId;

  // Set images field based on upload status
  if (imageOnCloudinary) {
    existingGuide.images = imageOnCloudinary.url;
  }

  // Save updated guide data
  const updatedGuide = await existingGuide.save();

  return res
    .status(200)
    .json(new ApiResponse(200, updatedGuide, "Guide Updated Successfully"));
});

const deleteGuide = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await TrekGuide.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Guide Deleted Successfully"));
});

const getAllGuides = asyncHandler(async (req, res) => {
  const guides = await TrekGuide.find();

  if (!guides) {
    throw new ApiError(404, "No guides found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, guides, "Guides retrieved successfully"));
});

const getGuideById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const guide = await TrekGuide.findById(id);

  if (!guide) {
    throw new ApiError(404, "Guide Not Found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, guide, "Guide Fetched Successfully"));
});

export { addGuide, editGuide, deleteGuide, getAllGuides, getGuideById };
