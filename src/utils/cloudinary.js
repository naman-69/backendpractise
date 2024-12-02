import {v2 as cloudinary} from "cloudinary";

import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath)=>{
    try{
        console.log("localFilepath is:",localFilePath);
        if(!localFilePath) return null;
        //upload the file on the cloudinary
        console.log("going to generate response");

        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //file has been uploaded
        fs.unlinkSync(localFilePath);
        console.log("file is uploaded on the cloudinary",response.url);
        return response;
    }catch(error){
        console.log("inside the catch part of cloudinary");
        fs.unlinkSync(localFilePath);//remove the locally saved temperory file as the upload opr got failed
        return null;
    }
}


export {uploadOnCloudinary};