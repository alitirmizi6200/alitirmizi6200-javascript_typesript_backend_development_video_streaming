import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/asyncHandler.ts'
import { errorAPI } from "../utils/errorAPI.ts"
import { User } from "../models/user.model.ts"
import { uploadOnCloudinary, deleteFromCloudinary} from '../utils/cloudinary.ts'
import { responseAPI } from '../utils/responseAPI.ts'
import { Types } from 'mongoose';
import jwt, { JwtPayload } from "jsonwebtoken";

interface IJwtPayload extends JwtPayload {
    _id: string;
}

const generateAccessAndRefreshToken = async (userId: Types.ObjectId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        user.refresh_token = refreshToken
        await user.save({validateBeforeSave: false}) // validateBeforeSave to ignore pre function  in mongo

        return {
            accessToken,
            refreshToken
        }
    } catch (err) {
        throw new errorAPI(500, `access and refresh generation token failed`)
    }
}

const registerUser = asyncHandler(async (req: Request, res:Response, next: NextFunction) => {
    // username, email, password, full_name, avatar,
    // (email regex), (avatar check if non-empty),(user already exist), (if file exist), (upload to cloudinary), (create user object to pass db), (remove password and refresh token from response)
        const {username, email, full_name, password} = req.body

        // all fields present
        if ([username, email, full_name, password].some((field) => field?.trim() === "")) {
            throw new errorAPI(400, `username, email, full_name, password is required `) }

        // email regex
        if(!String(email).toLowerCase().match(
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/))
            { throw new errorAPI(400, `Email format incorrect `) }

        // Email or username already exist
        const doesExist = await User.findOne({
            $or: [{ username }, { email }],
        }); if (doesExist) {
            throw new errorAPI(409, `Email or username already exist `)
        }

        // check uploaded files
        // @ts-ignore
        const avatarLocalPath = req.files?.avatar[0]?.path
        // @ts-ignore
        const coverImageLocalPath = req.files?.cover_image?.[0]?.path

        // avatar is compulsory
        if(!avatarLocalPath) {
            throw new errorAPI(400, `avatar is required `)
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath)
        const cover_image = await uploadOnCloudinary(coverImageLocalPath)

        // is avatar uploaded
        if(!avatar) {
            throw new errorAPI(500, `avatar upload failed`)
        }
        const user = await User.create({
            username: username.toLowerCase(),
            full_name,
            email,
            password,
            avatar: {
                public_id: avatar.public_id,
                url: avatar.url
            },
            cover_image: {
                public_id: cover_image?.public_id || "",
                url: cover_image?.url || ""
            },
        })

        // check user created successfully
        const createdUser = await User.findById(user._id).select("-password -refresh_token")
        if(!createdUser) {
            throw new errorAPI(500, `something went wrong creating user`)
        }

        return res.status(201).json(
            new responseAPI<Object>( 200, createdUser)
        );

});

const loginUser = asyncHandler(async (req: Request, res: Response) => {

    // get username and email (if user exist)
    // password check
    // generate refresh and access token
    // return cookies secure token
    // return response

    const {email , username, password} = req.body
    if (!email && !username) {
        throw new errorAPI(400, "username or email is required");
    }
    if (!password) {
        throw new errorAPI(400, "password is required");
    }

    const userIfExist = await User.findOne({
        $or: [{ username },{ email }]
    }); if (!userIfExist) {
        throw new errorAPI(404, `user not found `)
    }

    const isPasswordValid = await userIfExist.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new errorAPI(401, `password incorrect `)
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(userIfExist._id)

    const loggedInUser = await User.findById(userIfExist._id).select("-password -refresh_token");

    const cookieOptions = {
        httpOnly: true,
        secure: true
    }

    return res.status(201)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new responseAPI<object>(200, {
                loggedInUser,
                accessToken, // for non browser e.g. mobile app can be used in custom header
                refreshToken // for non browser e.g. mobile app can be used in custom header
            })
        )

})

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user
    await User.findByIdAndUpdate(user._id, {
        $set: {
            refresh_token: undefined
        }
    },{
        new: true
    })
    const cookieOptions = {
        httpOnly: true,
        secure: true
    }
    return res.status(201)
        .clearCookie("accessToken",cookieOptions)
        .clearCookie("refreshToken",cookieOptions)
        .json(
            new responseAPI<object>(200, {}, "user logged out successfully")
        )
})

const refreshAccessToken = asyncHandler( async (req: Request, res:Response, next: NextFunction)=> {
    try{
        const incomingRefreshToken =  req.cookies.refreshToken || req.body.refresToken
        if(!incomingRefreshToken){
            throw new errorAPI(401, "Unauthorized request login to continue")
        }

        const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET!) as IJwtPayload
        const user = await User.findById(decodedRefreshToken._id)

        if(!user){
            throw new errorAPI(401, "invalid Refresh token")
        }

        if(incomingRefreshToken === user?.refresh_token){
            throw new errorAPI(401, "refresh token expired")
        }

        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

        const cookieOptions = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(
                new responseAPI<object>(201, {}, "Access Token Refreshed")
            )
    } catch (err) {
        // @ts-ignore
        throw new errorAPI(err?.statusCode || 401, err?.message || "authorization failed")
    }
})

const updateCoverImage = asyncHandler( async (req: Request, res:Response, next: NextFunction)=> {

    // old image delete ?
    try{
        const user = req.user
        // @ts-ignore
        const localCoverImagePath = req.file?.path
        if(!localCoverImagePath) {
            throw new errorAPI(401, "image not found")
        }
        const cover_image = await uploadOnCloudinary(localCoverImagePath)
        if(!cover_image) {
            throw new errorAPI(401, "cover image upload failed")
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {cover_image: { public_id: cover_image.public_id, url: cover_image.url }},
            {new: true}
        ).select("-password -refresh_token")

        await deleteFromCloudinary(user.cover_image.public_id, "image")

        return res.status(200)
            .json(
                new responseAPI(201, updatedUser, "cover image Updated successfully")
            )
    } catch (err) {
        // @ts-ignore
        throw new errorAPI(err?.statusCode || 401, err?.message || "image upload failed")
    }
})

const updateAvatar = asyncHandler( async (req: Request, res:Response, next: NextFunction)=> {
    try{
        const localAvatarPath = req.file?.path
        const user = req.user
        if(!localAvatarPath) {
            throw new errorAPI(404, "image not found")
        }

        const avatar = await uploadOnCloudinary(localAvatarPath)
        if(!avatar) {
            throw new errorAPI(404, "avatar upload failed")
        }

        const updatedUser = await User
            .findByIdAndUpdate(
                req.user._id,
        {avatar: { public_id: avatar.public_id, url: avatar.url }},
        {new: true}
            ).select("-password -refresh_token")

        console.log(updatedUser)
        if(!updatedUser) {
            throw new errorAPI(404, "invalid user")
        }

        await deleteFromCloudinary(user.avatar.public_id, "image")

        return res.status(200).json(
            new responseAPI(201, updatedUser, "user avatar updated successfully")
        )

    } catch (err) {
        // @ts-ignore
        throw new errorAPI(err?.statusCode || 401, err?.message || "avatar upload failed")
    }
})

const updatePassword = asyncHandler( async (req: Request, res:Response, next: NextFunction)=> {
    try{
        const {old_password, new_password} = req.body
        const user = req.user
        const userIfExist = await User.findById(user._id)

        if(!userIfExist) {
            throw new errorAPI(404, "user not found")
        }

        const isPasswordCorrect = await userIfExist.isPasswordCorrect(old_password)

        if(!isPasswordCorrect) {
            throw new errorAPI(400, "invalid old password")
        }
        if(old_password === new_password) {
            throw new errorAPI(401, "new password cannot be old password")
        }
        user.password = new_password
        user.save({validateBeforeSave: false})
        return res.status(200)
            .json(new responseAPI(201, {}, "password changed successfull"))
    } catch (err) {
        // @ts-ignore
        throw new errorAPI(err?.statusCode || 401, err?.message || "password change failed")
    }
})

const deleteUser = asyncHandler( async (req: Request, res:Response, next: NextFunction)=> {
    try{
        const user = req.user
        const deletedUser = await User.findByIdAndDelete(user._id!);

        if (!user) {
            throw new errorAPI(404, 'User not found');
        }
        await deleteFromCloudinary(user.avatar.public_id, "image")
        await deleteFromCloudinary(user.cover_image.public_id, "image")
        res.status(200).json(
            new responseAPI(201, {} ,'User deleted successfully')
        )

        return res.status(200)
    } catch (err) {
        // @ts-ignore
        throw new errorAPI(err?.statusCode || 401, err?.message || "deletion failed")
    }
})

const getCurrentUser = asyncHandler( async (req: Request, res:Response, next: NextFunction)=> {
    try{
        return res.status(200).json(
            new responseAPI<typeof User>(201, req.user,"successful")
        )
    } catch (err) {
        // @ts-ignore
        throw new errorAPI(err?.statusCode || 401, err?.message || "Unable to get user")
    }
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, updateCoverImage, updateAvatar, updatePassword, deleteUser, getCurrentUser}
