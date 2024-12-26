import mongoose from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    // Validate required fields
    if (!name || !description) {
        throw new ApiError(400, "Please provide the name and description of the playlist.");
    }

    try {
        // Create a new playlist
        const playlistGenerated = await Playlist.create({
            owner: req.user?._id, // Ensure req.user is populated with the authenticated user's data
            name,
            description,
        });

        // Return success response
        return res.status(201).json(
            new ApiResponse(201, playlistGenerated, "Here is the generated playlist.")
        );
    } catch (error) {
        throw new ApiError(500, "Error in creating the playlist.");
    }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Validate if userId is provided
    if (!userId) {
        throw new ApiError(400, "Please provide the userId.");
    }

    // Validate if the userId is a valid ObjectId
    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Please provide a valid userId.");
    }

    try {
        // Find the playlists for the given userId and populate video details
        const playlists = await Playlist.find({ owner: userId }).populate({
            path: "videos",
            model: "Video",
            select: "title description videoFile thumbnail views isPublished",
        });

        // Check if no playlists were found
        if (playlists.length === 0) {
            return res.status(200).json(
                new ApiResponse(200, [], "No existing playlists found for this user.")
            );
        }

        // Return the found playlists
        return res.status(200).json(
            new ApiResponse(200, playlists, "Here are the playlists for this user.")
        );
    } catch (error) {
        throw new ApiError(500, "An error occurred while fetching playlists.");
    }
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    // Validate if playlistId is provided
    if (!playlistId) {
        throw new ApiError(400, "Please provide the playlistId.");
    }

    // Validate if the playlistId is a valid ObjectId
    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Please provide a valid playlistId.");
    }

    // Find the playlist and populate videos with their details
    const playlistGot = await Playlist.findById(playlistId).populate({
        path: 'videos', // Field in Playlist schema to populate
        model: 'Video', // Name of the Video model
        select: 'title description videoFile thumbnail views isPublished', // Fields to include from Video schema
    });

    // Check if no playlist was found
    if (!playlistGot) {
        return res.status(404).json(
            new ApiResponse(404, [], "No playlist found for this playlistId.")
        );
    }

    // Return the playlist along with video details
    return res.status(200).json(
        new ApiResponse(200, playlistGot, "Here is the playlist with video details.")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!playlistId || !videoId) {
        throw new ApiError(400, "Please provide the playlistId and videoId.");
    }

    // Validate if the playlistId is a valid ObjectId
    if (!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Please provide a valid playlistId and videoId.");
    }

    // Check if the playlist exists before attempting to delete
    const playlistExists = await Playlist.findById(playlistId);
    if (!playlistExists) {
        throw new ApiError(404, "Playlist not found.");
    }

    if (playlistExists.videos.includes(videoId)) {
        return res.status(400).json(
            new ApiResponse(400, {}, "This video is already added to the playlist.")
        );
    }

    playlistExists.videos.push(videoId);

    await playlistExists.save();

    // Return the success response
    return res.status(200).json(
        new ApiResponse(200, playlistExists, "Playlist Deleted Successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if (!playlistId || !videoId) {
        throw new ApiError(400, "Please provide the playlistId and videoId.");
    }

    // Validate if the playlistId is a valid ObjectId
    if (!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Please provide a valid playlistId and videoId.");
    }

    // Check if the playlist exists before attempting to delete
    const playlistExists = await Playlist.findById(playlistId);
    if (!playlistExists) {
        throw new ApiError(404, "Playlist not found.");
    }

    if (!playlistExists.videos.includes(videoId)) {
        return res.status(400).json(
            new ApiResponse(400, {}, "This video is not present in the playlist.")
        );
    }

    playlistExists.videos.pop(videoId);

    await playlistExists.save();

    // Return the success response
    return res.status(200).json(
        new ApiResponse(200, playlistExists, "Playlist Deleted Successfully")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    // Validate if playlistId is provided
    if (!playlistId) {
        throw new ApiError(400, "Please provide the playlistId.");
    }

    // Validate if the playlistId is a valid ObjectId
    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Please provide a valid playlistId.");
    }

    // Check if the playlist exists before attempting to delete
    const playlistExists = await Playlist.findById(playlistId);
    if (!playlistExists) {
        throw new ApiError(404, "Playlist not found.");
    }

    // Delete the playlist
    const playlistDel = await Playlist.deleteOne({ _id: playlistId });

    // Check if no playlists were deleted
    if (playlistDel.deletedCount === 0) {
        throw new ApiError(400, "Failed to delete the playlist.");
    }

    // Return the success response
    return res.status(200).json(
        new ApiResponse(200, { playlistId }, "Playlist Deleted Successfully")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    // Validate inputs
    if (!playlistId || !name || !description) {
        throw new ApiError(400, "Please provide a valid playlist ID, name, and description.");
    }

    // Update the playlist
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { name, description }, // Update fields
        { new: true, runValidators: true } // Options: return updated doc and validate fields
    );

    // If no playlist is found
    if (!updatedPlaylist) {
        throw new ApiError(404, "No playlist found with the provided ID.");
    }

    // Respond with the updated playlist
    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated successfully.")
    );
});


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}