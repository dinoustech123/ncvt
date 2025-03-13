import mongoose from "mongoose";
const admissionSchema = mongoose.Schema({
   branch_code : {
         type: String,
   },
    branch_name : {
            type: String,
    },
    branch_place : {
        type: String,
    },
    course_name : {
        type: String,
    },
    course_code :{
        type: String,
    },
    course_duration : {
        type: String,
    },
    course_duration : {
        type: String,
    },
    royalti_fees : {
        type: Number,
    },
    select_sessions : {
        type: String,
    },
    admission_date : {
        type: String,
    },
    admission_fee : {
        type: Number,
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
    admission_number : {
        type: String,
    }

},
    {
        timestamps: true,
    }
)

export default mongoose.model("admission", admissionSchema)