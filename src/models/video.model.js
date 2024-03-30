import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videoFile:{
        type: String, // cloudinary url
        required: true,
    },
    thumbnail:{
        type: String, // cloudinary url
        required: true,
    },
    title:{
        type: String,
        required: true,
    },
    description:{
        type: String,
        required: true,
    },
    duration:{
        type: Number, // cloudinary url
        required: true,
    },
    views:{
        type: Number,
        default: 0
    },
    isPublished:{
        type: Boolean,
        default: true
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

},{timestamps:true})

// we have to use it like this before using it
videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video",videoSchema)