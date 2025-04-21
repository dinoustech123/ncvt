import courseModel from "../../module/courseModel.js";


export async function add_caurses(req, res, next) {
    try {
        res.locals.message = req.flash();
        res.render("courses/addCourses", {
            sessiondata: req.session.data,
            selectQuery: "",
            selectQuery3: "",
            selectQuery2: "",
            teamName: "",
            emailValue: "",
            mobileNo: "",
        });
    } catch (err) {
        req.flash("error", "..server error..");
        res.redirect("/");
    }
}



export async function add_caurses_data(req, res, next) {
    try {
        if (req.body.subjects) {
            req.body.subjects = JSON.parse(req.body.subjects)
        }
        console.log("Req.body------>", req.body)
        if (req.body.is2ndyear == "on") {
            req.body.is2ndYear = true
        }
        if (req.body) {
            let course = await courseModel.create(req.body)
            if (course) {
                req.flash("success", "course Added Successfully");
                return res.redirect("/add_courses");
            }
        }
        req.flash("error", "data Not Found");
        return res.redirect("/add_courses");
    } catch (error) {
        console.error(error);
        req.flash("error", "..server error..");
        res.redirect("/");

    }


}


export async function view_all_Courses(req, res) {
    try {
        res.locals.message = req.flash();
        const { status, mobile } = req.query;
        return res.render("courses/viewAllCourses", {
            sessiondata: req.session.data,
            sessiondata: req.session.data,
            selectQuery: status,
            selectQuery3: status,
            selectQuery2: status,
            mobileNo: mobile,
        });
    } catch (err) {
        req.flash("error", "..server error..");
        res.redirect("/");
    }
}


export async function view_Courses_datatable(req, res) {
    try {
        const conditions = {}; // Your conditions here
        const start = req.query.start; // Retrieve start from the request query
        const limit1 = req.query.limit1; // Retrieve limit1 from the request query
        const sortObject = {}; // Define your sort object here
        const totalFiltered = await courseModel.countDocuments(conditions).exec();
        const rows1 = await courseModel
            .find(conditions)
            .skip(Number(limit1) ? Number(limit1) : "")
            .limit(Number(limit1) ? Number(limit1) : "")
            .sort(sortObject)
            .exec();
        let data = [];
        let count = 1;
        rows1.forEach((index) => {
            data.push({
                id: count,
                course_name: index.course_name,
                course_code: index.course_code,
                duration: index.duration == 24 ? "2 Years" : index.duration,
                admission_fees: index.admission_fees,
                exam_fees: index.exam_fees,
                is2ndYear: index.is2ndYear ? "Yes" : "No",
                // pincode: index.pincode,
                // directoreMob: index.directore_mob,
                // images: `<img src="${process.env.BASE_URL}/${index.images}" alt="Branch Image" style="width: 100px; height: 100px;">`,
                // youtuberStatus: index.youtuberStatus ? "Active" : "Inactive",


                action: `<a  onclick="delete_sweet_alert('/delete-course?courseId=${index._id}', 'Are you sure you want to delete this data?')" class="btn btn-sm btn-danger w-35px h-35px text-uppercase"><i class='fas fa-trash-alt'></i></a></div>`,

            });
            count++;
        });
        let json_data = JSON.stringify({
            recordsTotal: totalFiltered,
            recordsFiltered: totalFiltered,
            data: data,
        });
        res.send(json_data);
    }
    catch (error) {
        console.log(error);
    }
    // const branches = await branchModel.find();
    // res.render("Branch/viewAllBranch", {
    //     branches: branches
    // });
    // console.log(branches);
}




export async function delete_course(req, res, next) {
    try {
        if (!req.query.courseId) {
            req.flash("error", "..Branch Id Not Found..");
            res.redirect("/");
        }
        const course = await courseModel.findById(req.query.courseId);
        if (!course) {
            req.flash("error", "..server error..");
            return res.redirect("/");
        }
        await course.deleteOne()
        req.flash("success", "Course Deleted Successfully");
        return res.redirect("/view_all_courses");
    } catch (error) {
        console.error(error);
        req.flash("error", "..server error..");
        return res.redirect("/");
    }
}