import mongoose from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        index: true
    },
    description: {
        type: String,
        required: true,
    },
    video_file: {
        type: String, // cloudinary url
        required: true,
    },
    duration: {
        type: Number,
        required: true
    },
    thumbnail: {
        type: String, // cloudinary url
        required: true,
    },
    views: {
        type: Number,
        default: 0
    },
    is_Published: {
        type: Boolean,
        default: true
    },
    owner: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
    ]

},{timestamps: true})

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model('Video', videoSchema)