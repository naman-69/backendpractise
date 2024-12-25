import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription} from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Validate the presence of channelId
    if (!channelId) {
        throw new ApiError(400, "Please provide the channelId.");
    }

    // Check if a subscription exists
    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user?._id,
    });

    if (!existingSubscription) {
        // Create a new subscription if none exists
        const newSubscription = await Subscription.create({
            channel: channelId,
            subscriber: req.user?._id,
        });

        if (!newSubscription) {
            throw new ApiError(500, "Error in subscribing to the channel.");
        }

        return res.status(201).json(
            new ApiResponse(201, newSubscription, "Subscribed to the channel successfully.")
        );
    } else {
        // Unsubscribe by deleting the subscription
        const deletedSubscription = await Subscription.deleteOne({
            channel: channelId,
            subscriber: req.user?._id,
        });

        if (deletedSubscription.deletedCount === 0) {
            throw new ApiError(500, "Error in unsubscribing from the channel.");
        }

        return res.status(200).json(
            new ApiResponse(200, {}, "Unsubscribed from the channel successfully.")
        );
    }
});


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Validate the presence of channelId
    if (!channelId) {
        throw new ApiError(400, "Please provide the channelId.");
    }

    try {
        // Fetch channel subscribers
        const channelSubscribers = await Subscription.find({ channel: channelId });

        // Handle case when no subscribers are found
        if (!channelSubscribers || channelSubscribers.length === 0) {
            return res.status(200).json(
                new ApiResponse(200, [], "No subscribers found for the provided channelId.")
            );
        }

        // Return the list of subscribers
        return res.status(200).json(
            new ApiResponse(200, channelSubscribers, "Here are the subscribers for the provided channelId.")
        );
    } catch (error) {
        // Handle unexpected errors
        throw new ApiError(500, "An error occurred while fetching channel subscribers.");
    }
});


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    // Validate the presence of subscriberId
    if (!subscriberId) {
        throw new ApiError(400, "Please provide the subscriberId.");
    }

    // Fetch subscribed channels
    const subscribedChannels = await Subscription.find({ subscriber: subscriberId });

    // Return response if no subscriptions are found
    if (!subscribedChannels || subscribedChannels.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, [], "No subscribed channels found for the provided subscriberId.")
        );
    }

    // Return the list of subscribed channels
    return res.status(200).json(
        new ApiResponse(200, subscribedChannels, "Here are the subscribed channels for the provided subscriberId.")
    );
});


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}