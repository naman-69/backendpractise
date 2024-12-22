import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndGenerateTokens = async(userId)=>{
    try{
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRequestToken()

        console.log("accessToken is:",accessToken);
        console.log("refreshToken is:",refreshToken);

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave:false })

        return {accessToken,refreshToken};

    }catch(error){
        throw new ApiError(500,"Something went wrong");
    }
}


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
    // console.log("req is :",req);

    if(!fullName || !email || !username || !password){
        throw new ApiError(400,"Please provide all the required details to register");
    }

    const existedUser = await User.findOne({
        $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
    });

    if(existedUser){
        throw new ApiError(409,"User already exists");
    }

    console.log("req files is:",req.files);

    const avatarLocalPath = await req.files?.avatar[0]?.path;
    console.log('Avatar file path:', req.files?.avatar?.[0]?.path);
    // const coverImageLocalPath = await req.files?.coverImage[0]?.path;
    // console.log('Cover image file path:', req.files?.coverImage?.[0]?.path);

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }



    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is required");
    }


    let avatar, coverImage = { url: "" };
    try {
        console.log('Avatar file path:', avatarLocalPath);
        avatar = await uploadOnCloudinary(avatarLocalPath);
        console.log('Upload result:', avatar);

        if (coverImageLocalPath) {
            coverImage = await uploadOnCloudinary(coverImageLocalPath);
        }
    } catch (error) {
        throw new ApiError(500, `Error uploading files: ${error.message}`);
    }

    if (!avatar) {
        throw new ApiError(400, "Failed to upload avatar");
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


const loginUser = asyncHandler(async (req,res)=>{
    //req body->data
    //username or email
    //find the user
    //check the password
    //access and refresh token
    //send cookie

    const {email ,username ,password} = req.body;

    console.log("email is:",email);

    if(!username && !email){
        throw new ApiError(400,"Plz provide with either username or email")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"user dosen't exists");
    }

    const ispassValid = await user.isPasswordCorrect(password);

    if(!ispassValid){
        throw new ApiError(404,"Password dosen't matches");
    }

    const {accessToken , refreshToken} = await generateAccessAndGenerateTokens(user._id);

    const loggedinUser = await User.findById(user._id).select("-refreshToken -password");

    const options ={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken , options)
    .json(
        new ApiResponse(200,{
            user:accessToken,refreshToken,loggedinUser
        },"user Logged in successfully")
    )

})


const logOutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },{
            new:true 
        }
    )
    const options ={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{},"user Logged out successfully")
    )
})


const refreshAccessToken = asyncHandler(async(req,res,next)=>{
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized Request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.Refresh_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token");
        }
    
        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(401,"Refresh Token is expired or used");
        }
    
        const options ={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndGenerateTokens(user._id);
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,"refreshToken":newRefreshToken},
                "Access Token Refreshed Successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid Refresh Token")
    }
})


const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body;

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old Password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave:false});

    return res.status(200).json(
        new ApiResponse(200 , {} , "Password Changed Successfully")
    );
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200).json(
        new ApiResponse(200,req.user,"Current user fetched successfully")
    );
})

const updateAccountDetails = asyncHandler(async(req,res)=>{

    const {fullName , email} = req.body;

    if(!fullName || !email){
        throw new ApiError(400,"provide both the fullname and the email");
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200).json(
        new ApiResponse(200,user,"Account details updated successfully")
    );
})


const updateUserAvatar = asyncHandler(async(req,res)=>{
    avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar){
        throw new ApiError(400,"Error while uploading avatar on the cloudinay");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { 
            $set:{
                avatar : avatar.url
            }
        },
        {new : true}
    ).select("-password");

    return res.status(200).json(
        new ApiResponse(200,user,"Avatar Image Updated Successfully")
    );

});

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400 , "Cover Image file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage){
        throw new ApiError(400,"Error while uploading coverImage on the cloudinay");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { 
            $set:{
                coverImage : coverImage.url
            }
        },
        {new : true}
    ).select("-password");

    return res.status(200).json(
        new ApiResponse(200,user,"Cover Image Updated Successfully")
    );

});


const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params;

    if(!username?.trim()){
        throw new ApiError(400,"Plz provide me with the usename");
    }

    const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscription",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscription",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribeTo"
            }
        },
        {
            $addFields:{
                subscribersCount : {
                    $size : "$subscribers"
                },
                channelsSubscribedToCount:{
                    $size : "$subscribeTo"
                },
                isSubscribed:{
                    $cond:{
                        if: {$in: [req.user?._id , "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ])

    if(!channel){
        throw new ApiError(404,"Channel dosen't exists");
    }


    return res.status(200).json(new ApiResponse(
        200,channel[0],"User channel fetched successfully"
    ));


});


const getWatchHistory = asyncHandler(async(req,res)=>{

    const user = await User.aggregate([
        {
            $match:{
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json( new ApiResponse(
        200,
        user[0].watchHistory,
        "watched History send successfully"
    ));

})

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getWatchHistory
};