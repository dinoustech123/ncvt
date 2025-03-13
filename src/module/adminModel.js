import mongoose from "mongoose";

const adminSchema = mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    password: {
        type: String,
    },
    mobile: {
        type: Number,
    },
    role: {
        type: String,
    },
    status: {
        type: String,
    },

})

export default mongoose.model("admin", adminSchema)