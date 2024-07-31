import mongoose from 'mongoose';
import {dbName} from "../constants.ts"

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${dbName}`);
        console.log(`Connected to MongoDB, DB_HOST ${connectionInstance} \n ${connectionInstance.connection.host}`);
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

export default connectDB;