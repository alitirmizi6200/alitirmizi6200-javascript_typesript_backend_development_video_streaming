import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    full_name: {
        type: String,
        required: true,
        trim: true,
        index:true
    },
    avatar: {
        type: String, // cloudinary url
        required: true,
    },
    cover_image: {
        type: String, // cloudinary url
    },
    watch_history : [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        },
    ],
    refresh_token: {
        type: String,
    },


},{timestamps: true})

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next()
})

userSchema.methods.isPasswordCorrect = async function(password: string) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = async function() {
    jwt.sign( {
        _id: this._id,
        email: this.email,
        username: this.username
    },process.env.ACCESS_TOKEN_SECRET as string,{
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    } )
}
userSchema.methods.generateRefreshToken = async function() {
    jwt.sign( {
        _id: this._id,
    },process.env.REFRESH_TOKEN_SECRET as string,{
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    } )
}
export const User = mongoose.model('User', userSchema)