import mongoose from "mongoose";
const studentSchema = mongoose.Schema({

    branchId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "branch"
    },

    courseId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "course"
    },
    admissionId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admissions"
    },
    student_name : {
        type: String,
    },
    father_name : {
        type: String,
    },
    mother_name : {
        type: String,
    },
    dob : {
        type: String,
    },
    gender : {
        type: String,
    },
    qualification : {
        type: String,
    },
    nationality : {
        type: String,
    },
    mobile : {
        type: Number,
    },
    aadhar : {
        type: Number,
    },
    email : {
        type: String,
    },
    address : {
        type: String,
    },
    city : {
        type: String,
    },
    dist : {
        type: String,
    },
    state : {
        type: String,
    },
    pincode : {
        type: Number,
    },
    image : {
        type: String,
    },
    studentId : {
        type: String,
    },
    subjects : {
        type: Array,
    },
    exam_ispaid : {
        type : Boolean,
        default: false,
    },
    total_paid : {
        type : Number,
        default: 0,
    },
    roll_no : {
        type : Number,
    },
    certificate_required : {
        type : Boolean,
        default: false,
    },
    certificate_issued : {
        type : Boolean,
        default: false,
    },
    marks_enrollment : {
        type : Boolean,
        default : false,
    },
    sl_no : {
        type: String,
        default : "",
    }
},
    {
        timestamps: true,
    }
)

export default mongoose.model("student", studentSchema)