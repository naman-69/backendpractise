import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    try {
        // Extract the tweet content from the request body
        const { content } = req.body;

        // Validate input
        if (!content) {
            throw new ApiError(400, "Please provide the content of the tweet.");
        }

        // Create the tweet in the database
        const createdTweet = await Tweet.create({
            content,
            owner: req.user?._id, // Ensure the user is authenticated
        });

        // Respond with the created tweet
        return res.status(201).json(
            new ApiResponse(201, createdTweet, "Tweet created successfully.")
        );
    } catch (error) {

        console.error("Internal Server Error:", error);

        return res.status(500).json({
            status: 500,
            message: "An unexpected error occurred. Please try again later.",
        });
    }
});


const getUserTweets = asyncHandler(async (req, res) => {
    try {
        // Extract user ID from request parameters
        const { userId } = req.params;

        // Validate input
        if (!userId) {
            throw new ApiError(400, "Please provide a valid user ID.");
        }

        // Fetch tweets by the user
        const tweets = await Tweet.find({ owner: userId });

        // Check if tweets exist
        if (!tweets || tweets.length === 0) {
            return res.status(200).json(
                new ApiResponse(200, [], "No tweets found for this user.")
            );
        }

        // Return the user's tweets
        return res.status(200).json(
            new ApiResponse(200, tweets, "Here are the tweets for this user.")
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


const updateTweet = asyncHandler(async (req, res) => {
    try {
        // Extract tweet ID and content from the request
        const { tweetId } = req.params;
        const { content } = req.body;

        // Validate input
        if (!tweetId || !content) {
            throw new ApiError(400, "Please provide both the tweet ID and the new content.");
        }

        // Find and update the tweet
        const updatedTweet = await Tweet.findByIdAndUpdate(
            tweetId,
            { $set: { content: content } },
            { new: true } // Return the updated document
        );

        // Check if the tweet exists
        if (!updatedTweet) {
            throw new ApiError(404, "Tweet with the specified ID does not exist.");
        }

        // Return the updated tweet
        return res.status(200).json(
            new ApiResponse(200, updatedTweet, "The tweet has been updated successfully.")
        );
    } catch (error) {

        console.error("Internal Server Error:", error);

        return res.status(500).json({
            status: 500,
            message: "An unexpected error occurred. Please try again later.",
        });
    }
});


const deleteTweet = asyncHandler(async (req, res) => {
    try {
        // Extract tweet ID from the request
        const { tweetId } = req.params;

        // Validate the input
        if (!tweetId) {
            throw new ApiError(400, "Please provide the tweet ID.");
        }

        // Delete the tweet
        const delTweet = await Tweet.deleteOne({ _id: tweetId });

        // Check if the tweet was actually deleted
        if (delTweet.deletedCount === 0) {
            throw new ApiError(404, "Tweet with the specified ID does not exist.");
        }

        // Return success response
        return res.status(200).json(
            new ApiResponse(200, {}, "Tweet deleted successfully.")
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


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}