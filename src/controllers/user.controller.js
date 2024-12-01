import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndGenerateTokens = async(userId)=>{
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRequestToken()

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
    console.log("req is :",req);

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


export {registerUser,loginUser,logOutUser};