import mongoose from "mongoose";

const courseSchema = mongoose.Schema({
    course_name :{
        type: String,
    },
    course_code :{
        type: String,
    },
    duration :{
        type: Number,
    },
    is2ndYear : {
        type: Boolean,
        default: false,
    },
    admission_fees : {
        type: String,
    },
    exam_fees : {
        type: String,
    },
    subjects : {
        type: Array,
    }
    

},
    {
        timestamps: true,
    }
)

export default mongoose.model("course", courseSchema)