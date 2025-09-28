import asyncHandler from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import ApiResponse from "../utils/ApiResponse.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"   
import jwt from "jsonwebtoken"

const generateAccessTokenandRefreshToken = async(userId) =>{
    try {
        const user = await User.findById(userId)
        if(!user){
            throw new ApiError(404, "User not found")
        }
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false}) //we need not check other conditions like password
        return {accessToken, refreshToken}
    }
    catch(error){
        throw new ApiError("500", "Something went wrong while generation access and refresh token")
    }

}

const registerUser = asyncHandler(async (req, res) => {
    const { username, fullname, email, password } = req.body;
    console.log("Email:", email);
    if (
        [fullname, email, username, password].some(
            (field) => typeof field !== "string" || field.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }
    const existedUser = await User.findOne({
        $or : [{username: username},{email}]
    })

    if(existedUser){
        throw new ApiError(409, "User with same email or username Already Exits")
    }
console.log("BODY:", req.body);
console.log("FILES:", req.files);

    if (!req.files || !req.files.avatar || !req.files.avatar[0]) {
        throw new ApiError(400, "Avatar file is required")
    }
    if (!req.files.coverImage || !req.files.coverImage[0]) {
        throw new ApiError(400, "Cover image file is required")
    }

    const avatarLocalPath = req.files.avatar[0].path
    const coverImageLocalPath = req.files.coverImage[0].path

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(500, "Failed to upload avatar")
    }
    if(!coverImage){
        throw new ApiError(500, "Failed to upload cover image")
    }

    const user = await User.create({
        username : username.toLowerCase(),
        fullname,
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

const loginUser = asyncHandler(async (req, res) => {
    const {email, password , username} = req.body;
    if(!username && !email){
        throw new ApiError(400, "Email or username is required")
    }

    const user = await User.findOne({
        $or : [{username},{email}]
    })

    if(!user){
        throw new ApiError(404, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid password")
    }

    const {accessToken,refreshToken} = await generateAccessTokenandRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    //cookie sending 
    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
        200,
        "User logged in successfully",
        {
            user : loggedInUser,
            accessToken,
            refreshToken
        }
        )
    )

})

const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Remove refresh token from DB
    await User.findByIdAndUpdate(
        userId,
        { $unset: { refreshToken: 1 } }, // removes the field completely
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "User logged out successfully"));
});

const refreshToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401, "Refresh token is missing")
    }
    jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
            if(err){
                throw new ApiError(401, "Invalid or expired refresh token")
            }
            const user = await User.findById(decoded._id)
            if(!user || user.refreshToken !== incomingRefreshToken){
                throw new ApiError(401, "Invalid refresh token")
            }
            const {accessToken, refreshToken} = await generateAccessTokenandRefreshToken(user._id)

            const options = {
                httpOnly : true,
                secure : true
            }
            
            return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                200,
                "Token refreshed successfully",
                {
                    accessToken,
                    refreshToken
                }
                )
            )
        }
    )
});

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const check = await user.isPasswordCorrect(oldPassword)

    if(!check){
        throw new ApiError(400, "Old password is incorrect")
    }
    user.password = newPassword
    await user.save({validateBeforeSave : true})
    return res.status(200).json(new ApiResponse(200, "Password changed successfully"))
});

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id).select("-password -refreshToken")
    if(!user){
        throw new ApiError(404, "User not found")
    }
    return res.status(200).json(new ApiResponse(200, "User fetched successfully", user))
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {username, fullname, email} = req.body
    if(!username && !fullname && !email){
        throw new ApiError(400, "At least one field is required to update")
    }
    const user = User.findById(req.user?._id)
    if(!user){
        throw new ApiError(404, "User not found")
    }
    if(username) user.username = username
    if(fullname) user.fullname = fullname
    if(email) user.email = email
    
    await user.save({validateBeforeSave : true})
    return res.status(200).json(new ApiResponse(200, "User details updated successfully"))
});

const updateProfilePictures = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(404, "User not found")
    }
    
    if(req.files?.avatar && req.files?.avatar[0]){
        const avatarLocalPath = req.files.avatar[0].path
        const avatar = await uploadOnCloudinary(avatarLocalPath)
        if(!avatar){
            throw new ApiError(500, "Failed to upload avatar")
        }
        user.avatar = avatar.secure_url
    }
    
    if(req.files?.coverImage && req.files?.coverImage[0]){
        const coverImageLocalPath = req.files.coverImage[0].path
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)
        if(!coverImage){
            throw new ApiError(500, "Failed to upload cover image")
        }
        user.coverImage = coverImage.secure_url
    }
    await user.save({validateBeforeSave : true})
    return res.status(200).json(new ApiResponse(200, "Profile pictures updated successfully"))
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId){
        throw new ApiError(400, "Channel ID is required")
    }
    const channel = await User.aggregate([
        {
            $match :{
                username : channelId
            }
        },
    {
        $lookup : {
            from : "subscriptions",
            localField : "_id",
            foreignField : "channel",
            as : "subscribers"
        }
    },
    {
        $lookup :{
            from : "subscriptions",
            localField : "_id",
            foreignField : "subscriber",
            as : "channelsSubscribedTo"
        }
    },
    {
        $addFields : {
            subscribersCount : {
                $size : "$subscribers"
            },
            subscribedChannelsCount : {
                $size : "$channelsSubscribedTo"     
            },
            isSubscribed : {
                $cond : {
                    if : {
                        $in : [req.user?._id, "$subscribers.subscriber"]
                    },
                    then : true,
                    else : false
                }
            }
    }
},
    {
        $project : {
            fullname : 1,
            username : 1,
            email : 1,
            avatar : 1,
            coverImage : 1,
            subscribersCount : 1,
            subscribedChannelsCount : 1,
            isSubscribed : 1
        }
}
    ])

    if (!channel || channel.length == 0){
        throw new ApiError(404, "Channel not found")
    }

    return res.status(200).json(new ApiResponse(200, "Channel fetched successfully", channel[0]))
    //console.log(channel[0]); 
    //to see the output in console 1 contains only one entry 
});

export { registerUser,
    loginUser,
    logoutUser,
    changeCurrentUserPassword,
    getCurrentUser,
    refreshToken,
    updateAccountDetails
};
 