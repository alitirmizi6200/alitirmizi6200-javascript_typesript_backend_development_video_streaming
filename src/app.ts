import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { dataLimit } from './constants.ts'

const app = express();

app.use(cors({ // Cross-origin resource sharing (CORS) is an extension of the same-origin policy. You need it for authorized resource sharing with external third parties.
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ // json parser limit set to not overload server
    limit: dataLimit
}))

app.use(express.urlencoded({ // url parser + or %20 etc
    extended: true,
    limit: dataLimit
}))

app.use(express.static("public")) // server static files in ti case stored in public folder

app.use(cookieParser())

app.get('/', (req, res) =>{
    res.status(200).send('Welcome to the app!')
})

// user Router
import { userRouter } from './routes/user.router.ts'
app.use("/api/v1/user", userRouter)


export { app };