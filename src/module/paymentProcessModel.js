import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const paymentProcessSchema = new Schema({
    amount: {
        type: String,
    },
    paymentMethod: {
        type: String,
    },
    status: {
        type: String,
    },
    txnid: {
        type: String,
    },
    userid : {
        type: mongoose.Types.ObjectId,
        ref: 'User',
    }
},
    {
        timestamps: true,
    }
);

const PaymentProcess = model('PaymentProcess', paymentProcessSchema);

export default PaymentProcess;