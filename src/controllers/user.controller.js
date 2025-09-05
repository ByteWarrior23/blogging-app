import asyncHandler from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import ApiResponse from "../utils/ApiResponse.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"   

const registerUser = asyncHandler(async (req, res) => {
    const { userName, fullName, email, password } = req.body;
    console.log("Email:", email);
    if (
        [fullName, email, userName, password].some(
            (field) => typeof field !== "string" || field.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }
    const existedUser = await User.findOne({
        $or : [{username: userName},{email}]
    })

    if(existedUser){
        throw new ApiError(409, "User with same email or username Already Exits")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }
    if(!coverImageLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(500, "Failed to upload avatar")
    }
    if(!coverImage){
        throw new ApiError(500, "Failed to upload cover image")
    }

    const user = await User.create({
        username : userName.toLowerCase(),
        fullName,
        email,
        password,
        avatar : avatar.secure_url,
        coverImage : coverImage.secure_url
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    //already selected so remove by -password -refreshtoken
    
    if(!createdUser){
        throw new ApiError(500,"Something Went Wrong while registration")
    }
    return res.status(201).json(
        new ApiResponse(200,"User registered successfully",createdUser)
        )
});

export { registerUser };
 