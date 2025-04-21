import { Schema } from "mongoose";
import mongoose from "mongoose";
let Transaction = new Schema({
    userid: {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    admission_id: {
        type: mongoose.Types.ObjectId,
        ref: 'admissions'
    },
    type: {
        type: String,
        default: ''
    },
    transaction_id: {
        type: String
    },
    transaction_by: {
        type: String,
        default: "transaction"
    },
    amount: {
        type: Number,
        default: 0
    },
    prize: {
        type: String,
        default: ""
    },
    paymentstatus: {
        type: String,
        default: 'confirmed'
    },
    contestdetail: {
        type: String,
        default: '0'
    },


    bonus_amt: {
        type: Number,
        default: 0
    },
    win_amt: {
        type: Number,
        default: 0
    },
    addfund_amt: {
        type: Number,
        default: 0
    },
    bal_bonus_amt: {
        type: Number,
        default: 0
    },
    bal_win_amt: {
        type: Number,
        default: 0
    },
    bal_fund_amt: {
        type: Number,
        default: 0
    },
    total_available_amt: {
        type: Number,
        default: 0
    },
    challenge_join_amt: {
        type: Number,
        default: 0
    },
    withdraw_amt: {
        type: Number,
        default: 0
    },
    cons_bonus: {
        type: Number,
        default: 0
    },
    cons_win: {
        type: Number,
        default: 0
    },
    cons_amount: {
        type: Number,
        default: 0
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    utr_number: {
        type: String,
        default: ""
    },
    student_id: {
        type: mongoose.Types.ObjectId,
        ref: 'students'
    },
    comment: {
        type: String,
        default: ""
    },

}, {
    timestamps: true,
    versionKey: false
})
export default mongoose.model('transaction', Transaction);