import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/asyncHandler.ts'
import { ErrorAPI } from "../utils/errorAPI.ts"
import { User } from "../models/user.model.ts"
import { uploadOnCloudinary } from '../utils/cloudinary.ts'
import { responseAPI } from '../utils/responseAPI.ts'


const registerUser = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {
    // username, email, password, full_name, avatar,
    // (email regex), (avatar check if non-empty),(user already exist), (if file exist), (upload to cloudinary), (create user object to pass db), (remove password and refresh token from response)
        const {username, email, full_name, password} = req.body

        // all fields present
        if ([username, email, full_name, password].some((field) => field?.trim() === "")) {
            throw new ErrorAPI(400, `username, email, full_name, password is required `, ) }

        // email regex
        if(!String(email).toLowerCase().match(
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/))
            { throw new ErrorAPI(400, `Email format incorrect `, ) }

        // Email or username already exist
        const doesExist = await User.findOne({
            $or: [{ username }, { email }],
        }); if (doesExist) {
            throw new ErrorAPI(409, `Email or username already exist `, )
        }

        // check uploaded files
        // @ts-ignore
        const avatarLocalPath = req.files?.avatar[0]?.path
        // @ts-ignore
        const coverImageLocalPath = req.files?.cover_image?.[0]?.path

        // avatar is compulsory
        if(!avatarLocalPath) {
            throw new ErrorAPI(400, `avatar is required `, )
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath)
        const cover_image = await uploadOnCloudinary(coverImageLocalPath)

        // is avatar uploaded
        if(!avatar) {
            throw new ErrorAPI(500, `avatar upload failed`, )
        }
        const user = await User.create({
            username: username.toLowerCase(),
            full_name,
            email,
            password,
            avatar: avatar.url,
            cover_image: cover_image?.url || ""
        })

        // check user created successfully
        const createdUser = await User.findById(user._id).select("-password -refresh_token")
        if(!createdUser) {
            throw new ErrorAPI(500, `something went wrong creating user`, )
        }

        return res.status(201).json(
            new responseAPI<Object>( 200, createdUser)
        );

});

export { registerUser }