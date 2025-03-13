import { model, Schema } from "mongoose";

const franchiseSchema = new Schema({
    conter_name: {
        type: String,
    },
    director_name: {
        type: String,
    },
    mobile: {
        type: String,
    },
    email: {
        type: String,
    },
    state: {
        type: String,
    },
    district: {
        type: String,
    },
    block: {
        type: String,
    },
    apply_for : {
        type: String,
    }

    // other fields for franchise details
}, {
    timestamps: true,
})


export default model("franchise", franchiseSchema);