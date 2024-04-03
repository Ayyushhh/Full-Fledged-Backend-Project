import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
  });

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath){
            console.log("File path not there")
            return null
        }
        //for upload on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        //unlink file from cloudinary
        fs.unlinkSync(localFilePath)
        //file uploaded successfully
        console.log("File is uploaded on cloudinary",response.url);
        return response
    }
    catch (error){
        //removing saved temparory files as the uploaded got failed
        fs.unlinkSync(localFilePath)
        return null
    }
}

export {uploadOnCloudinary}