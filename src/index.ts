import dotenv from 'dotenv';
import { connectDB } from './db/index.ts';
import { app } from "./app.ts";
import {v2 as cloudinary} from 'cloudinary'


dotenv.config({ path: `./.env` });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

connectDB().then(r => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server started on port ${process.env.PORT}`);
    })
}).catch((err) => {
    console.log("MongoDB connection failed",err);
})