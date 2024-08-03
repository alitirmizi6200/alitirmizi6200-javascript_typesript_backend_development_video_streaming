import dotenv from 'dotenv';
import { connectDB } from './db/index.ts';
import { app } from "./app.ts";
import { uploadOnCloudinary, configCloudinary} from './utils/cloudinary.ts'


dotenv.config({ path: `./.env` });
configCloudinary()

connectDB().then(r => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server started on port ${process.env.PORT}`);
    })
}).catch((err) => {
    console.log("MongoDB connection failed",err);
})