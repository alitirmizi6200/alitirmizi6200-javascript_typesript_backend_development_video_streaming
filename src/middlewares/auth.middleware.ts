import { asyncHandler } from '../utils/asyncHandler.ts'
import { Request, Response, NextFunction } from 'express';
import { errorAPI } from '../utils/errorAPI.ts'
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../models/user.model.ts";
interface IJwtPayload extends JwtPayload {
    _id: string;
}

const verifyJWT = asyncHandler( async (req: Request, res: Response, next: NextFunction) => {

        try {
            const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

            if (!token) {
                throw new errorAPI(401, "Unauthorized request")
            }
            console.log(token)

            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!)as IJwtPayload
            const user = await User.findById(decodedToken._id).select("-password -refresh_token")

            if (!user) {
                throw new errorAPI(401, "Invalid Access Token")
            }

            req.user = user
            next()
        } catch (err) {
            // @ts-ignore
            throw new errorAPI(err?.statusCode || 401, err?.message || "authorization failed")
        }
    res.status(200)
})

export { verifyJWT }