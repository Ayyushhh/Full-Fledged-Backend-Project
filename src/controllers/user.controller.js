import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
    if(!email || !username){
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

    return res.status(200).clearcookie("accessToken",options)
    .clearcookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged out"))
})

export {registerUser,loginUser,logoutUser}