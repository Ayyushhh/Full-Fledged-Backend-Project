import mongoose, {Schema } from "mongoose";

//jwb is bearare token h (means jiske pass bhi hoga woh accept krlega)
import jwt from "jsonwebtoken";

import bcrypt from "bcrypt";



const userSchema = new Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname:{
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar:{
        type: String, //cloudinary url
        required: true,
    },
    coverImage:{
        type: String,
    },
    watchHistory:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "video"
        }
    ],
    password:{
        type:String,
        required: [true,'Password is required']
    },
    refreshToken:{
        type: String,
    }
},{timestamps:true})



//password 
userSchema.pre("save", async function(next) {
    // just check if the password is modified or not then only change it
    if(!this.isModified("password")) return next();

    this.password = bcrypt.hash(this.password,10)
    next()
})

// we need to check the password is valid or not  
// bcrypt also provide this functionality
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

//generate jwt token
userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    })
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    })
}


export const User = mongoose.model("User",userSchema)