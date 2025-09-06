import {Router} from "express";
import { loginUser, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import {ApiError} from "../utils/ApiError.js"
import multer from "multer";
import { logoutUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json(new ApiError(400, "File too large. Maximum size is 5MB"));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json(new ApiError(400, "Too many files"));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json(new ApiError(400, "Unexpected field"));
        }
    }
    if (err.message === 'Only image files are allowed!') {
        return res.status(400).json(new ApiError(400, "Only image files are allowed"));
    }
    next(err);
};

router.route("/register").post(
    upload.fields([
    {
        name : "avatar",
        maxCount : 1
    },{
        name : "coverImage",
        maxCount : 1
    }
    ]),
    handleMulterError,
    registerUser
)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT, logoutUser)

export default router;
