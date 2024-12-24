import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {

    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!videoId){
        throw new ApiError(400,"Plz provide me with the videoId");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid videoId format");
    }

    const comments = await Comment.find({ video: videoId })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }); // Optional: Sort by creation time

    // Check if comments exist
    if (comments.length === 0) {
        throw new ApiError(404, "No comments found for the provided videoId");
    }

    return res.status(200).json(
        new ApiResponse(200, comments , "Here are the comments for the perticular VideoId")
    )
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {video,content} = req.body;
    if(!video || !content){
        throw new ApiError(400,"Provide with both the videoId and the Content");
    }
    try {
        const newComment = await Comment.create({
            video,
            content,
            owner: req.user?._id // Assuming req.user is populated via middleware
        });

        // Return success response
        return res.status(201).json(new ApiResponse(201, newComment, "Added comment successfully"));
    } catch (error) {
        // Handle potential errors during creation
        throw new ApiError(500, "Failed to add comment");
    }
});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params;
    const {content} = req.body;
    if(!commentId || !content){
        throw new ApiError(400,"Provide with both the commentId and the Content");
    }
    try {
        // Update the comment
        const updatedComment = await Comment.findByIdAndUpdate(
            commentId,
            { $set: { content: content } },
            { new: true } // Return the updated document
        );

        // If no comment is found, throw a 404 error
        if (!updatedComment) {
            throw new ApiError(404, "Comment with this commentId doesn't exist");
        }

        // Return success response
        return res.status(200).json(
            new ApiResponse(200, updatedComment, "Updated comment successfully")
        );
    } catch (error) {
        // Handle potential invalid ObjectId or other errors
        throw new ApiError(500, "Failed to update the comment");
    }
});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;
    if(!commentId){
        throw new ApiError(400,"Provide the commentId to delete the comment");
    }
    try {
        // Attempt to delete the comment
        const result = await Comment.deleteOne({ _id: commentId });

        // Check if a comment was deleted
        if (result.deletedCount === 0) {
            throw new ApiError(404, "Comment doesn't exist");
        }

        // Return success response
        return res.status(200).json(
            new ApiResponse(200, {}, "Comment deleted successfully")
        );
    } catch (error) {
        // Handle invalid ObjectId or other errors
        if (error.name === "CastError" || error.name === "BSONTypeError") {
            throw new ApiError(400, "Invalid commentId format");
        }
        throw new ApiError(500, "Failed to delete the comment");
    }
});

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}