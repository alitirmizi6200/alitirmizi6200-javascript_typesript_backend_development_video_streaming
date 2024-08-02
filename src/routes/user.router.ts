import { Router } from 'express'
import { registerUser, loginUser, logoutUser,refreshAccessToken } from '../controllers/user.controller.ts'
import { upload } from "../middlewares/multer.middleware.ts"
import { verifyJWT } from '../middlewares/auth.middleware.ts'

const userRouter = Router()

userRouter.route("/register").post(upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },{
            name: "cover_image",
            maxCount: 1
        }
    ]),registerUser)

userRouter.route("/login").post(loginUser)

// secure routes
userRouter.route("/logout").post(verifyJWT, logoutUser)

userRouter.route("/refresh-token").post(refreshAccessToken)

export {userRouter}
