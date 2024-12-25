import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = '', sortBy = 'createdAt', sortType = 'desc', userId } = req.query;

    // Validate userId
    if (!userId) {
        throw new ApiError(400, "Please provide the userId.");
    }

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "The user with the provided userId does not exist.");
    }

    // Build the query for videos
    const filter = {
        owner: userId,
        title: { $regex: query, $options: 'i' }, // Search by title
    };

    // Sort options
    const sortOptions = {
        [sortBy]: sortType === 'desc' ? -1 : 1,
    };

    // Fetch videos with pagination
    const videos = await Video.find(filter)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    // Check if videos exist
    if (!videos || videos.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, [], "There are no videos for the provided userId.")
        );
    }

    // Return the videos
    return res.status(200).json(
        new ApiResponse(200, videos, "Here are the videos for the provided userId.")
    );
});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    // Extract file paths from the request
    const videoPath = req.files?.videoFile?.path;
    const thumbPath = req.files?.thumbnail?.path;

    // Validate input fields
    if (!videoPath || !thumbPath || !title || !description) {
        throw new ApiError(400, "Please provide videoPath, thumbPath, title, and description");
    }

    // Upload video and thumbnail to Cloudinary
    const [videoUploadResult, thumbUploadResult] = await Promise.all([
        uploadOnCloudinary(videoPath),
        uploadOnCloudinary(thumbPath)
    ]);

    if (!videoUploadResult || !thumbUploadResult) {
        throw new ApiError(500, "Failed to upload the video or thumbnail to Cloudinary");
    }

    // Create video entry in the database
    const videoDetails = await Video.create({
        title,
        description,
        thumbnail: thumbUploadResult.url,
        videoFile: videoUploadResult.url,
        owner: req.user?._id,
    });

    if (!videoDetails) {
        throw new ApiError(500, "Failed to save video details to the database");
    }

    // Return response with the created video details
    return res.status(201).json(
        new ApiResponse(201, videoDetails, "Video successfully published")
    );
});


const getVideoById = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;

        // Validate input
        if (!videoId) {
            throw new ApiError(400, "Please provide a valid video ID.");
        }

        // Fetch video by ID
        const gotVideo = await Video.findById(videoId);

        // Check if video exists
        if (!gotVideo) {
            throw new ApiError(404, "The video with the provided video ID does not exist.");
        }

        // Return success response
        return res.status(200).json(
            new ApiResponse(200, gotVideo, "Here is the video with the provided video ID.")
        );
    } catch (error) {
        
        console.error("Internal Server Error:", error);

        // Return a generic error response
        return res.status(500).json({
            status: 500,
            message: "An unexpected error occurred. Please try again later.",
        });
    }
});


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const thumbPath = req.file?.path;

    if (!videoId) {
        throw new ApiError(400, "Please provide the videoId to update the video details");
    }

    // Validate videoId format (optional)
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid videoId format");
    }

    // Handle thumbnail upload if provided
    let cloudThumbPath = null;
    if (thumbPath) {
        cloudThumbPath = await uploadOnCloudinary(thumbPath);

        if (!cloudThumbPath) {
            throw new ApiError(500, "Error while uploading Thumbnail to Cloudinary");
        }
    }

    // Prepare the update object dynamically
    const updateFields = { ...req.body }; // title, description, etc.
    if (cloudThumbPath) {
        updateFields.thumbnail = cloudThumbPath.url;
    }

    // Update video details in the database
    const updatedVideo = await Video.findByIdAndUpdate(videoId, updateFields, { new: true });

    if (!updatedVideo) {
        throw new ApiError(404, "The video with this videoId does not exist");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video details updated successfully")
    );
});



const deleteVideo = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;

        // Validate input
        if (!videoId) {
            throw new ApiError(400, "Please provide a valid video ID.");
        }

        // Perform deletion
        const deletedVideo = await Video.deleteOne({ _id: videoId });

        // Check if deletion was successful
        if (!deletedVideo || deletedVideo.deletedCount === 0) {
            throw new ApiError(404, "The video with the provided video ID does not exist.");
        }

        // Return success response
        return res.status(200).json(
            new ApiResponse(200, {}, "The video was deleted successfully.")
        );
    } catch (error) {
        
        console.error("Internal Server Error:", error);

        // Return a generic error response
        return res.status(500).json({
            status: 500,
            message: "An unexpected error occurred. Please try again later.",
        });
    }
});


const togglePublishStatus = asyncHandler(async (req, res, next) => {
    try {
        const { videoId } = req.params;

        if (!videoId) {
            // Missing videoId in the request
            throw new ApiError(400, "Please provide a valid videoId to toggle the isPublished field.");
        }

        // Attempt to update the video and toggle isPublished
        const updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            { $bit: { isPublished: { xor: 1 } } }, // Toggles the boolean value
            { new: true }
        );

        if (!updatedVideo) {
            // If video with videoId does not exist
            throw new ApiError(404, "The video with the given videoId does not exist.");
        }

        // Successfully toggled
        return res.status(200).json(
            new ApiResponse(200, updatedVideo, "Successfully toggled the isPublished status.")
        );
    } catch (error) {
        // Handle any unexpected errors
        return next(new ApiError(500, "Invalid videoId provided or something went wrong."));
    }
});


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}