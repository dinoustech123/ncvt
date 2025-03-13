import mongoose from "mongoose";

const BranchSchema = mongoose.Schema({
    branch_name: {
        type: String,
    },
    branch_code: {
        type: String,
    },
    password : {
        type: String,
    },
    directore_name: {
        type: String,
    },
    location: {
        type: String,
    },
    city: {
        type: String,
    },
    dist: {
        type: String,
    },
    state: {
        type: String,
    },
    pincode: {
        type: Number,
    },
    directore_mob: {
        type: Number,
    },
    images: {
        type: String,
    },
    validate_date: {
        type: String,
    },
    userbalance: {
        balance: {
            type: Number,
            default: 0
        },
    },

},
    {
        timestamps: true,
    }
)

export default mongoose.model("branch", BranchSchema)