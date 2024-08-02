import mongoose from 'mongoose'
import { User } from "./user.model.ts";

const subscriptionSchema = new mongoose.Schema({
    channel: { // who se channel is being subscribed
        type: mongoose.Schema.Types.ObjectId,
        ref: User
    },
    subscriber: { // who is subscribing
        type: mongoose.Schema.Types.ObjectId,
        ref: User
    }
}, {
    timestamps: true
})

const Subscription = mongoose.model("Subscription", subscriptionSchema)
