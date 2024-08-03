import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

const configCloudinary = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    console.log("cloudinary configured successfully")
}
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

const deleteFromCloudinary = async (public_id:string, file_type: string) => {
    try {
        if(!public_id) return null

        await cloudinary.uploader.destroy(public_id.trim(), {
            resource_type: file_type
        });

        console.log(`file deleted successfully`);
    }catch (error) {
        console.log('file deletion failed', {error});
        return null;
    }
}

export { uploadOnCloudinary, configCloudinary, deleteFromCloudinary}