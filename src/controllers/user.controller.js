import asyncHandler from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"   

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
    const existedUser = User.findOne({
        $or : [{username},{email}]
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

    const avatar = await uploadOnCloudianary(avatarLocalPath)
    const coverImage = await uploadOnCloudianary(coverImageLocalPath)

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

    const createdUser = User.findById(user._id).select(
        "-password -refreshToken"
    )
    //already selected so remove by -password -refreshtoken
    
    if(!createdUser){
        throw new ApiError(500,"Something Went Wrong while registration")
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
        )
});

export { registerUser };
 