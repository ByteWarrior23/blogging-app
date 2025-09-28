import mongoose, { Schema } from 'mongoose';

const SubstriptionSchema = new Schema ({
    subscriber : {
        type : Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    channel : {
        type : Schema.Types.ObjectId,
        ref : "User",
        required : true
    }
},{timestamps : true})

export const Subcription = mongoose.model('Subscription', SubstriptionSchema);