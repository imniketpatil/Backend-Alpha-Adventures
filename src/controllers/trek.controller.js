import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Trek } from "../models/trek.model.js";

const addTrek = async (req, res) => {
  const {
    name,
    highlights,
    description,
    location,
    difficulty,
    trekType,
    price,
    startDate,
    endDate,
    guides,
    images,
  } = req.body;

  try {
    // Basic validation
    if (
      !name ||
      !highlights ||
      !description ||
      !location ||
      !difficulty ||
      !price
    ) {
      return res
        .status(400)
        .json({ error: "All required fields must be provided" });
    }

    // Create new Trek instance
    const newTrek = new Trek({
      name,
      highlights,
      description,
      location,
      difficulty,
      trekType,
      price,
      startDate: startDate || Date.now(),
      endDate: endDate || Date.now(),
      guides,
      images,
    });

    // Save the trek to the database
    await newTrek.save();

    // Return success response
    return res.status(201).json(newTrek);
  } catch (error) {
    // Handle errors
    console.error("Error adding trek:", error);
    return res.status(500).json({ error: "Failed to add trek" });
  }
};

const aggregateTrekForAdmin = asyncHandler(async (req, res) => {
  try {
    const trekForAdmin = await Trek.aggregate([
      {
        $lookup: {
          from: "trekguides",
          localField: "guides",
          foreignField: "_id",
          as: "guideDetails",
        },
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
        $unwind: {
          path: "$trekTypeDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          name: 1,
          highlights: 1,
          description: 1,
          location: 1,
          endDate: 1,
          difficulty: 1,
          price: 1,
          startDate: 1,
          images: 1,
          guideDetails: {
            name: 1,
          },
          trekTypeDetails: {
            name: 1,
          },
        },
      },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, trekForAdmin, "Treks successfully fetched"));
  } catch (error) {
    console.error("Error fetching trek data for admin:", error);
    throw new ApiError(500, "An error occurred while fetching the trek data");
  }
});

export { addTrek, aggregateTrekForAdmin };
