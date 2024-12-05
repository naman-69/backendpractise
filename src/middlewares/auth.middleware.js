import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _ , next) => {
    try {
        // Extract token from cookies or Authorization header
        const headerToken = req.header("Authorization");
        const token = req.cookies?.accessToken ||
        (headerToken && headerToken.startsWith("Bearer ") ? headerToken.replace("Bearer ", "") : null);
            
        console.log("Extracted token from:", req.cookies?.accessToken ? "Cookie" : headerToken ? "Header" : "None");
        console.log("Extracted token:", token);

        if (!token || typeof token !== "string") {
            throw new ApiError(401, "Unauthorized request: Invalid or missing token");
        }



        // Verify token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Find user
        const user = await User.findById(decodedToken._id).select("-password -refreshToken");
        if (!user) {
            throw new ApiError(401, "Invalid access token: User not found");
        }

        req.user = user; // Attach user to the request object
        next();
    } catch (error) {
        console.error("JWT verification error:", error.stack || error);
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});
