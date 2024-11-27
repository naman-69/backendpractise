import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res)=>{
    //get the userdata from the frontend 
    //validation not empty
    // check if user already exists:username /emails 
    //check for images and check for avatar
    //upload them to cloudinary , avatar
    //create user object - create any in db
    //remove password and the refresh token from feild
    //check for the user creation   
    //return response

    const {fullName , email , username , password }=req.body;

    console.log("req body is :",req.body);

    if(!fullName || !email || !username || !password){
        throw new ApiError(400,"Please provide all the required details to register");
    }

    const existedUser = User.findOne({
        $or:[{ username },{ email }]
    })

    if(existedUser){
        throw new ApiError(409,"User already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar file is required");
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage: coverImage.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser =  await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user");
    }

    // return res.status(201).json({
    //     status:200,
    //     success:true,
    //     message : "The registration is completed ",
    //     data:createdUser
    // })
    //              or
    return res.status(201).json({
        response: new ApiResponse(201, createdUser, "The registration is completed")
    });
    

})


export {registerUser};