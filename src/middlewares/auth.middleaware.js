import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized Request - No Token Provided");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decodedToken?._id) {
      throw new ApiError(401, "Unauthorized Request - Invalid Token Structure");
    }

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Unauthorized Request - User Not Found");
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);
    throw new ApiError(
      401,
      error.message || "Unauthorized Request - Invalid Access Token"
    );
  }
});
