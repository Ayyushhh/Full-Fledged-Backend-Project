import mongoose, { isValidObjectId } from "mongoose";
import {Comment} from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {Video} from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Video id invalid");
    }

    const skip = (page-1)*limit;
    const comments = await Comment.aggregate([
        {
            $match:{
                video: mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $skip:skip
        },
        {
            $limit:limit
        }
    ])

    return res.status(200).json(new ApiResponse(200,{comments}, " comments fetched successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    
    const {videoId} = req.params
    const {content} = req.body;
    const validateVideo = await Video.findById(videoId);
    if(!validateVideo){
        throw new ApiError(400,"Video not found so cannot add comment");
    }
    
    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    })

    res.status(200).json(new ApiResponse(200,{comment},"Comment Add successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
    
    const {commentId} = req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid Comment id - update comment");
    }

    const {content} = req.body;
    if(!content){
        throw new ApiError(400,"Content is required")
    }

    const updateComment = await Comment.findByIdAndUpdate(
        {
            _id: commentId
        },
        {
            $set:{
                content: content
            }
        },
        {
            new: true
        }
    )

    if(!updateComment){
        throw new ApiError(500, "Comment update failed");
    }

    res.status(200).json(new ApiResponse(200,{updateComment},"Update Comment Successful"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commetId} = req.params
    if(!isValidObjectId(commetId)){
        throw new ApiError(400,"Invalid Comment Id cannot delete it")
    }

    const deletedComment = await Comment.findByIdAndDelete(commetId);
    if (!deletedComment) {
        throw new ApiError(500, "Comment deletion failed");
    }

    res.status(200).json(new ApiResponse(200,{deletedComment},"delete Comment Successful"))

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}