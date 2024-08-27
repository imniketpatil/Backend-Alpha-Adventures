import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  updateAccountDetails,
  deleteAccount,
  getCurrentUser,
  changeCurrentPassword,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleaware.js";
import { verifyAdmin } from "../middlewares/adminAuth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);

router.route("/login").post(loginUser);

//* Secured Routes
router.route("/currentuser").get(getCurrentUser);
router.route("/logout").post(logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/edit-user").patch(updateAccountDetails);
router.route("/change-password").patch(changeCurrentPassword);
router.route("/delete-user").delete(deleteAccount);

export default router;
