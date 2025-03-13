import { Schema } from "mongoose";
import mongoose from "mongoose";
const depositSchema = new Schema(
    {
        userId: {
            type: mongoose.Types.ObjectId
        },
        amount: {
            type: Number,
        },
        status: {
            type: String,
            default: 'pending',
            enum: ['pending', 'approved', 'rejected']
        },
        image: {
            type: String,
            default: ""
        },
        transaction_id: {
            type: String,
        },
        userTransactionId: {
            type: String,
        },

        comment: {
            type: String,
            default: ''
        },
        approveDate: {
            type: String,
            default: ''
        },
        utr_number :{
            type: String,
            default: ''
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export default mongoose.model('deposit', depositSchema);
