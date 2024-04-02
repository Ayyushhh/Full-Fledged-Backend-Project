import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

//method hai ye 
const registerUser = asyncHandler( async (req,res) => {
    // remove password and refresh token field from response
    // check for user creation
    // return response (res)

    // get user details from frontend
    const {fullname, email, username, password} = req.body
    console.log("email: ",email);


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
    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exist")
    }


    // check for images, avatar
        // multer ne upload krdiya h ab le rhe h wahan se
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required");
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
        //auto create this _id when create
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Register Successfully")
    )

})

export {registerUser}