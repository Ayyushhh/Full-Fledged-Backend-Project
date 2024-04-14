import mongoose,{isValidObjectId} from "mongoose";
import {User} from "../models/user.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    // get the content from the body and validate it
    // save the tweet in the database
    // return the response
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Content is required");
    }

    const tweet = await Tweet.create({ content, owner: req.user?._id });

    if (!tweet) {
        throw new ApiError(500, "Tweet creation failed");
    }

    res.status(200).json(
        new ApiResponse(200, { tweet: tweet }, "Tweet created successfully")
    );
});

const getUserTweets = asyncHandler(async (req, res) => {
    // get the user Id from the params
    const {userId}= req.params;

    // validate the user id
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid Tweet User Id")
    }

    // write the pipeline code
    const tweets = await Tweet.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId),
            }
        },
    ])
    // return the response
    res.status(200).json(new ApiResponse(201,{tweets},"Getting User tweet successfully"));

})

const updateTweet = asyncHandler(async (req, res) => {
    //get user 
    const userId = req.params
    //validate user
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid Tweet User Id - for update tweet")
    }
    //get updated content
    const {content} = req.body;

    // update in db
    const updateTweet = await User.findByIdAndUpdate(userId,{
        $set:{
            content
        }
    },{new: true})

    res.status(200).json(new ApiResponse(201,{updateTweet},"Tweet Updated Successfully"))

})

const deleteTweet = asyncHandler(async (req, res) => {
    //get user 
    const {tweetId} = req.params
    
    //check whether the tweet exists in the db 
    const validateTweet = await Tweet.findById(tweetId);
    if(!validateTweet){
        throw new ApiError(400,"Invalid Tweet Id");
    }

    // check the user who wants to delete the tweet, it should be the owner
    if(validateTweet?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400,"Only owner is able to delete it")
    }
    // delete the tweet from the database and validate it
    const deleteTweet = await Tweet.findByIdAndDelete(validateTweet);

    // return the response
    res.status(200).json(new ApiResponse(200,{deleteTweet},"Successfully deleted the tweet"));
})

export {createTweet, getUserTweets, deleteTweet, updateTweet}