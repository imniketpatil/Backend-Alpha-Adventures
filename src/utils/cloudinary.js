import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("Cloudinary Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("Cloudinary API Key:", process.env.CLOUDINARY_API_KEY);
console.log("Cloudinary API Secret:", process.env.CLOUDINARY_API_SECRET);

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    console.log("localFilePath", localFilePath);

    // ! upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath); // ! remove the temp file saved locally

    //!file upload done
    console.log("File is Uploaded on Cloudinary", response.url);

    return response;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    console.error("Error details:", error.message);

    fs.unlinkSync(localFilePath); // ! remove the temp file saved locally

    return null;
  }
};

export { uploadOnCloudinary };
