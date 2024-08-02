import { Router } from 'express'
import { registerUser, loginUser, logoutUser,refreshAccessToken, updatePassword, getCurrentUser, deleteUser,  updateAvatar, updateCoverImage} from '../controllers/user.controller.ts'
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

userRouter.route("/update-password").patch(verifyJWT, updatePassword)

userRouter.route("/get-current-user").get(verifyJWT, getCurrentUser)

userRouter.route("/delete-current-user").delete(verifyJWT, deleteUser)

userRouter.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar)

userRouter.route("/update-cover-image").patch(verifyJWT, upload.single( "cover_image"), updateCoverImage)

export {userRouter}
