import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

const uploadOnCloudinary = async (file_path:string) => {
    try {
        if(!file_path) return null
        const response = await cloudinary.uploader.upload(file_path, {
            resource_type: "auto"
        });
        console.log(`file uploaded successfully ${response}`);
        fs.unlinkSync(file_path)
        return response;
    }catch (error) {
        fs.unlinkSync(file_path)
        console.log('file uploaded failed');
        return null;
    }
}

export { uploadOnCloudinary }