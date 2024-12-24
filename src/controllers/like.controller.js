import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;

        // Validate `videoId`
        if (!videoId) {
            throw new ApiError(400, "Please provide the VideoId to toggle the like.");
        }

        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            throw new ApiError(400, "Invalid VideoId format.");
        }

        // Check if the like already exists
        const existingLike = await Like.findOne({
            likedBy: req.user?._id,
            video: videoId,
        });

        if (existingLike) {
            // If like exists, remove it
            await Like.deleteOne({
                likedBy: req.user?._id,
                video: videoId,
            });

            return res.status(200).json(
                new ApiResponse(200, {}, "Toggled successfully, and the video is now disliked.")
            );
        } else {
            // If like does not exist, create it
            const newLike = await Like.create({
                likedBy: req.user?._id,
                video: videoId,
            });

            return res.status(201).json(
                new ApiResponse(201, newLike, "Toggled successfully, and the video is now liked.")
            );
        }
    } catch (error) {
        
        // Log unknown errors for debugging
        console.error("Internal Server Error:", error);

        return res.status(500).json({
            status: 500,
            message: "An unexpected error occurred. Please try again later.",
        });
    }
});


const toggleCommentLike = asyncHandler(async (req, res) => {
    try {
        const { commentId } = req.params;

        // Validate `commentId`
        if (!commentId) {
            throw new ApiError(400, "Please provide the commentId to toggle the like.");
        }

        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            throw new ApiError(400, "Invalid commentId format.");
        }

        // Check if the like already exists
        const existingLike = await Like.findOne({
            likedBy: req.user?._id,
            comment: commentId,
        });

        if (existingLike) {
            // If like exists, remove it
            await Like.deleteOne({
                likedBy: req.user?._id,
                comment: commentId,
            });

            return res.status(200).json(
                new ApiResponse(200, {}, "Toggled successfully, and the comment is now disliked.")
            );
        } else {
            // If like does not exist, create it
            const newLike = await Like.create({
                likedBy: req.user?._id,
                comment: commentId,
            });

            return res.status(201).json(
                new ApiResponse(201, newLike, "Toggled successfully, and the comment is now liked.")
            );
        }
    } catch (error) {
        
        // Log unknown errors for debugging
        console.error("Internal Server Error:", error);

        return res.status(500).json({
            status: 500,
            message: "An unexpected error occurred. Please try again later.",
        });
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    try {
        const { tweetId } = req.params;

        // Validate `commentId`
        if (!tweetId) {
            throw new ApiError(400, "Please provide the tweetId to toggle the like.");
        }

        if (!mongoose.Types.ObjectId.isValid(tweetId)) {
            throw new ApiError(400, "Invalid tweetId format.");
        }

        // Check if the like already exists
        const existingLike = await Like.findOne({
            likedBy: req.user?._id,
            tweet: tweetId,
        });

        if (existingLike) {
            // If like exists, remove it
            await Like.deleteOne({
                likedBy: req.user?._id,
                tweet: tweetId,
            });

            return res.status(200).json(
                new ApiResponse(200, {}, "Toggled successfully, and the tweet is now disliked.")
            );
        } else {
            // If like does not exist, create it
            const newLike = await Like.create({
                likedBy: req.user?._id,
                tweet: tweetId,
            });

            return res.status(201).json(
                new ApiResponse(201, newLike, "Toggled successfully, and the tweet is now liked.")
            );
        }
    } catch (error) {
        
        // Log unknown errors for debugging
        console.error("Internal Server Error:", error);

        return res.status(500).json({
            status: 500,
            message: "An unexpected error occurred. Please try again later.",
        });
    }
});


const getLikedVideos = asyncHandler(async (req, res) => {
    try {
        // Retrieve all liked videos for the authenticated user
        const likedVideos = await Like.find({
            likedBy: req.user?._id, // Ensure the user is authenticated
        }).populate("video"); // Populate video details (optional, based on schema setup)

        // If no liked videos are found, return an appropriate message
        if (!likedVideos || likedVideos.length === 0) {
            return res.status(200).json(
                new ApiResponse(200, [], "No liked videos by this user.")
            );
        }

        // Return the list of liked videos
        return res.status(200).json(
            new ApiResponse(200, likedVideos, "Here are all the liked videos by this user.")
        );
    } catch (error) {
        console.error("Internal Server Error:", error);

        return res.status(500).json({
            status: 500,
            message: "An unexpected error occurred. Please try again later.",
        });
    }
});


export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}