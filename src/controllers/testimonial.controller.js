import { Testimonial } from "../models/testimonial.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const createTestimonial = asyncHandler(async (req, res) => {
  const { name, trek, work, rating, comment } = req.body;
  console.log("Request body:", req.body);
  console.log("Uploaded files:", req.files);

  if (
    [name, trek, work, rating, comment].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const testimonialImageLocalPath = req.files?.testimonialAvatar[0]?.path;
  console.log("Local image path:", testimonialImageLocalPath);

  if (!testimonialImageLocalPath) {
    throw new ApiError(400, "Image File is Required");
  }

  const imageOnCloudinary = await uploadOnCloudinary(testimonialImageLocalPath);
  console.log("Image uploaded to Cloudinary:", imageOnCloudinary);

  if (!imageOnCloudinary) {
    throw new ApiError(400, "Image File Didn't Upload");
  }

  const testimonial = await Testimonial.create({
    name,
    trek,
    work,
    rating,
    comment,
    images: imageOnCloudinary.url,
  });

  if (!testimonial) {
    throw new ApiError(500, "Something Went wrong while Adding Testimonial");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, testimonial, "Testimonial Created Successfully")
    );
});

const updateTestimonialDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, trek, work, rating, comment } = req.body;

  console.log("Request body:", req.body);
  console.log("Uploaded files:", req.file); // Use req.file if using upload.single

  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  const testimonialImageLocalPath = req.file.path;
  console.log("Local image path:", testimonialImageLocalPath);

  let imageOnCloudinary;
  try {
    imageOnCloudinary = await uploadOnCloudinary(testimonialImageLocalPath);
    console.log("Image uploaded to Cloudinary:", imageOnCloudinary);
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw new ApiError(500, "Image upload failed");
  }

  if (!imageOnCloudinary) {
    throw new ApiError(500, "Image File Didn't Upload");
  }

  const testimonial = await Testimonial.findByIdAndUpdate(
    id, // Use the id to find the document
    {
      name,
      trek,
      work,
      rating,
      comment,
      images: imageOnCloudinary.url,
    },
    { new: true }
  );

  if (!testimonial) {
    throw new ApiError(500, "Something Went Wrong While Updating Testimonial");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, testimonial, "Testimonial Updated Successfully")
    );
});

const deleteTestimonial = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await Testimonial.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Testimonial Deleted Successfully"));
});

const getAllTestimonials = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.find();

  if (!testimonial || testimonial.length === 0) {
    throw new ApiError(404, "No Trek Type Found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, testimonial, "Trek Type Retrieved Successfully")
    );
});

const getAllTestimonial = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const testimonial = await Testimonial.findById(id);

  if (!testimonial || testimonial.length === 0) {
    throw new ApiError(404, "No Trek Type Found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, testimonial, "Trek Type Retrieved Successfully")
    );
});

export {
  createTestimonial,
  updateTestimonialDetails,
  deleteTestimonial,
  getAllTestimonials,
  getAllTestimonial,
};
