import { Router } from 'express'
import { registerUser } from '../controllers/user.controller.ts'
import { upload } from "../middlewares/multer.middleware.ts"
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

export {userRouter}
