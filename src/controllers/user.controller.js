import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async(userID) => {
    try{
        const user = await User.findById(userID)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        //refresh Token ko database mai kaise daale
        user.refreshToken = refreshToken
        //now save krdo
        await user.save({validateBeforeSave: false})

        return {accessToken,refreshToken}

    }
    catch(error){
        throw new ApiError(500,"Something went wrong while generating Access and Refresh Token")
    }
}

//method hai ye 
const registerUser = asyncHandler( async (req,res) => {
    
    // get user details from frontend
    const {fullname, email, username, password} = req.body
    // console.log("email: ",email);


    // validate if the fields are empty or not

        // basic 
        // if(fullname === ""){
        //     throw new ApiError(400, "fullname is required")
        // }

        //advance  ?is considered as optionally
    if(
        [fullname,email,username,password].some( (field) => field?.trim() === "" )
    ){
        throw new ApiError(400, "All fields are required")
    }


    // check already exist - username and email (user model)
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exist")
    }


    // check for images, avatar
        // multer ne upload krdiya h ab le rhe h wahan se
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required");
    }
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    // upload on cloudinary , check for avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar){
        throw new ApiError(400,"Avatar file is required - after cloudinary upload");
    }


    // create user object - create entry in db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        // ? is imp because humne check nhi kra h ki coverimage h ki nhi
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // remove password and refresh token field from response
        //auto create this _id when create
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // check for user creation
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    // return response (res)
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Register Successfully")
    )

})

const loginUser = asyncHandler( async (req,res) => {
    // req body se data lekr aao (User ka input data)
    const {email, username, password} = req.body
    // username or email 
    if(!(email || username)){
        throw new ApiError(400,"Email or Username is required")
    }
    // find the user
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404,"User not exist")
    }
    // password check
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Password Incorrect")
    }
    // access and refresh token generate
        //method bana lo for easy to use
    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)
    
    //optional ki agar koi filed remove krni h kya user ko 
    const loggedInUsr = await User.findById(user._id).select("-password -refreshToken")

    // send krdo ye dono ko cookie mai
    const options = {
        //server se hi modify krskte h not from frontend
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,{
            user: loggedInUsr, accessToken, refreshToken
        },"User Logged in Successfully")
    )
})

//logout 
const logoutUser = asyncHandler(async(req,res) => {
    //to logout remove or reset cookies first 
    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken:undefined
        }
    })

    const options = {
        //server se hi modify krskte h not from frontend
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged out"))
})

const refreshAccessToken = asyncHandler(async(req,res) => {
    // access krlo cookie se 
    const incomingRefreshToken  = req.cookie.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }

    // now verify 
    try {
        const decodedRefreshToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        
        const user = await User.findById(decodedRefreshToken?._id)
        
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        //now match it
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh Token is expired or used")
        }
    
        // now use that above generate func to generate new refresh token
        const options = {
            httpOnly: true,
            secure: true
        }
        const {accessToken, newrefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res.status(200).cookie("accessToken",accessToken, options)
        .cookie("refreshToken",newrefreshToken, options)
        .json(new ApiResponse(
            200,
            {accessToken,refreshToken: newrefreshToken},
            "Access Token Refresh"
            )
        )
    }
    catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler( async(req,res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid Old Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(200).json(new ApiResponse(200,{},"Password Change Successfully"))

})

const getCurrentUser = asyncHandler( async(req,res) => {
    return res.status(200).json(new ApiResponse(200,req.user,"Current User Fetched Successfully"))
})

const updateAccountDetials = asyncHandler(async(req,res) => {
    const {fullname, email} = req.body
    
    if(!fullname || email){
        throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email:email
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"Account Details updated Successfully"))
})

const updateUserAvatar = asyncHandler( async(req,res) =>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new:true}
    ).select("-password")

    //delete prev image using utility and using url

    return res.status(200).json(new ApiResponse(200,user,"Avatar updated Successfully"))

})

const updateUserCoverImage = asyncHandler( async(req,res) => {
    const coverImagelocalPath = req.file?.path

    if(!coverImagelocalPath){
        throw new ApiError(400,"Cover Image is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImagelocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading the coverImage")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    )
    return res.status(200).json(new ApiResponse(200,user,"Cover Image updated Successfully"))
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    //params to get the username from url
    const {username} = req.params

    if(!username){
        throw new ApiError(400,"Username is missing")
    }

    // user aggregate pipeline to get the instead instead of searach in the User.find
    // ye array return krta h
    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "Subscription",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from: "Subscription",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size: "$subscribers"
                },
                channelsSubscribedToCount:{
                    $size :"$subscribedTo"
                },
                isSubscribed:{
                    //now to check into this array or object if the user id is there
                    // or not inside this subscribers field which we just created using lookup
                    // to look into the user $in and then use if and else to check if it is present or not
                    $cond:{
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            // only the selected item you want to give
            $project:{
                fullname: 1,
                username: 1,
                subscriberCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])
    // console.log(channel);
    if(!channel?.length){
        throw new ApiError(404,"Channel doesnot exist")
    }

    res.status(200).json(new ApiResponse(200,channel[0], "User fetched successfuallt"))

})

// watch history
const getWatchHistory = asyncHandler(async(req,res)=>{
    // yahan pr string milti h baaki moongose apne aap convert krdeta h req.user._id
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project:{
                                        username: 1,
                                        fullname: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    //just to adjust the make it easier for frontend otherwise it will send the array
                    {
                        $addFields:{
                            owner:{
                                // first or arrayat 
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },
        {

        }
    ])

    return res.status(200).json(new ApiResponse(200,user[0].watchHistory,"WatchHistory fetched successfully"))
})

export {
    registerUser,loginUser,logoutUser,
    refreshAccessToken,changeCurrentPassword,getCurrentUser,
    updateAccountDetials,updateUserAvatar,updateUserCoverImage,
    getUserChannelProfile, getWatchHistory
}