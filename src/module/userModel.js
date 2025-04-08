import mongoose from "mongoose";
import bcrypt from "bcrypt";

const documents = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    matric: {
        type: String,
    },
    inter: {
        type: String,
    },
    NTT_certificate: {
        type: String,
    },
})

const documentName = new mongoose.Schema({
    matric: {
        type: String,
    },
    inter: {
        type: String,
    },
    NTT_certificate: {
        type: String,
    },
    NTT_II_year: {
        type: String,
    },
    image: {
        type: String,
    },
    sign: {
        type: String,
    }
})



const userSchema = mongoose.Schema({
    name: {
        type: String,
    },
    cleanpass: {
        type: String,
    },
    aadhar: {
        type: Number,
    },
    mobile: {
        type: Number,
    },
    father_name: {
        type: String,
    },
    mother_name: {
        type: String,
    },
    dob: {
        type: String,
    },
    village: {
        type: String,
    },
    city: {
        type: String,
    },
    post: {
        type: String,
    },
    district: {
        type: String,
    },
    state: {
        type: String,
    },
    idMark: {
        type: String,
    },
    nationality: {
        type: String,
    },
    police_station: {
        type: String,
    },
    pincode: {
        type: Number,
    },
    gender: {
        type: String,
    },
    category: {
        type: String,
    },
    tnc: {
        type: Boolean,
    },
    code: {
        type: Number,
    },
    username: {
        type: String,
        default: "",
    },
    email: {
        type: String,
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["user", "admin", "associate"],
        default: "user"
    },
    image: {
        type: String,
    },
    signature: {
        type: String,
    },
    authToken: {
        type: String,
    },
    refreshToken: {
        type: String,
    },
    documents: documents,
    docName: documentName,
    userbalance: {
        balance: {
            type: Number,
            default: 0
        },
        withdrawal_balance: {
            type: Number,
            default: 0
        }
    },
    referedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    percentage: {
        type: Number,
        default: 0
    },
    courses: {}
}, {
    timestamps: true,
})





userSchema.methods.comparePassword = async function (password) {
    try {
        return await bcrypt.compare(String(password), this.password);
    } catch (err) {
        throw err;
    }
};
export default mongoose.model("user", userSchema);