import mongoose ,{Schema} from "mongoose";

const playlistSchema = new Schema(
    {
        name:{
            type:String,
            required:true,
        },
        description:{
            type:String,
            required:true,
        },
        videos:[
            {
                type:Schema.Types.ObjectId,
                required:true,
                ref:"Video"
            }
        ],
        owner:{
            type:Schema.Types.ObjectId,
            required:true,
            ref:"User"
        },
    },
    {
        timestamps:true
    }
)

export const Playlist = mongoose.model("Playlist",playlistSchema);