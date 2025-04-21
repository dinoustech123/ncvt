import userModel from "../../module/userModel.js";
import studentModel from "../../module/studentModel.js"
import admissionModel from "../../module/admissionModel.js";
export async function view_AllUsers(req, res, next) {
  try {
    res.locals.message = req.flash();
    const { status, name, email, mobile } = req.query;
    res.render("admission/viewAllAdmission", {
      sessiondata: req.session.data,
      selectQuery: status,
      selectQuery3: status,
      selectQuery2: status,
      teamName: name,
      emailValue: email,
      mobileNo: mobile,
    });
  } catch (error) {
    req.flash("error", "..server error..");
    res.redirect("/");
  }
}

export async function view_users_datatable(req, res, next) {
  try {
    const conditions = [
      {
        $lookup: {
          from: "admissions",
          localField: "admissionId",
          foreignField: "_id",
          as: "admission",
        },
      },
      {
        $unwind: {
          path: "$admission",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "courses",
        },
      },
      {
        $unwind: {
          path: "$courses",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "branches",
          localField: "branchId",
          foreignField: "_id",
          as: "branch",
        },
      },
      {
        $unwind: {
          path: "$branch",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          student_name: 1,
          dob: 1,
          gender: 1,
          mobile: 1,
          studentId: 1,
          branch_code: "$branch.branch_code",
          branch_name: "$branch.branch_name",
          course_code: "$courses.course_code",
          course_name: "$courses.course_name",
          duration: "$courses.duration",
        },
      },
    ];

    const start = req.query.start || 0; // Retrieve start from the request query
    const limit1 = req.query.limit1 || 100; // Retrieve limit1 from the request query
    const sortObject = { student_name: 1 }; // Sorting by student name (modify as needed)

    // Count total documents
    const totalFilteredArray = await studentModel.aggregate([...conditions, { $count: "total" }]);
    const totalFiltered = totalFilteredArray.length > 0 ? totalFilteredArray[0].total : 0;

    // Paginated users
    const rows1 = await studentModel.aggregate(conditions).sort(sortObject).exec();

    let data = [];
    let count = start + 1;

    rows1.forEach((index) => {
      data.push({
        id: count,
        student_name: index.student_name,
        dob: index.dob,
        gender: index.gender,
        mobile: index.mobile,
        admission_number: index.studentId,
        duration: index.duration,
        action: `<a class="btn btn-sm text-uppercase mr-2 btn-primary w-35px h-35px" title="Edit" href="/edit_admission?Id=${index._id}"> <i class="fas fa-pencil" aria-hidden="true"></i></a>`,
      });
      count++;
    });

    let json_data = {
      recordsTotal: totalFiltered,
      recordsFiltered: totalFiltered,
      data: data,
    };

    res.json(json_data);
  } catch (error) {
    console.error("Error in view_users_datatable:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function view_AllVerifiedUsers(req, res, next) {
  try {
    res.locals.message = req.flash();
    const { status, name, email, mobile } = req.query;
    res.render("users/viewAllVerifiedUser", {
      sessiondata: req.session.data,
      selectQuery: status,
      selectQuery3: status,
      selectQuery2: status,
      teamName: name,
      emailValue: email,
      mobileNo: mobile,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
}

export async function view_Verifusers_datatable(req, res, next) {
  try {
    const conditions = { isPaid: true }; // Your conditions here
    const start = req.query.start; // Retrieve start from the request query
    const limit1 = req.query.limit1; // Retrieve limit1 from the request query
    const sortObject = {}; // Define your sort object here

    // Count the total number of documents
    const totalFiltered = await userModel.countDocuments(conditions).exec();

    // Find the users with pagination
    const rows1 = await userModel
      .find(conditions)
      .skip(Number(limit1) ? Number(limit1) : "")
      .limit(Number(limit1) ? Number(limit1) : "")
      .sort(sortObject)
      .exec();

    let data = [];
    let count = 1;

    rows1.forEach((index) => {
      let blockLink;
      let youtuberStatus;
      console.log(index, "User Data");
      data.push({
        id: count,
        username: index.name,
        email: `<a href="/getUserDetails/${index._id}">${index.email}</a>`,
        mobile: index.mobile || "",
        aadhar: index.aadhar || "",
        category: index.category || "",
        courses: index.courses
          ? Object.entries(index.courses)
            .map(
              ([key, value]) =>
                `${key}: Year - ${value.year}, TotalMarks - ${value.totalMarks}, ObtainedMarks - ${value.obtainedMarks}`
            )
            .join(" <br> ")
          : "",
        district: index.district || "",
        dob: index.dob || "",
        address: `${index.village} ${index.state}-${index.pincode}`,
        father_name: index.father_name || "",
        mother_name: index.mother_name || "",
        gender: index.gender || "",
        idMark: index.idMark || "",
        nationality: index.nationality || "",
        police_station: index.police_station || "",
        post: index.post || "",
        // action: `<div class="dropdown">
        //         <button class="btn btn-primary btn-md rounded-pill dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        //           Action
        //         </button>
        //         <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
        //           <a class="dropdown-item" href="/viewtransactions/${index._id}">User Transactions</a>
        //          ${blockLink}
        //           <a class="dropdown-item" href="/changeYotuberStatus/${index._id}">${youtuberStatus}</a>
        //           <a class="dropdown-item" href="/editUserDetails-page/${index._id}">Edit User Details</a>
        //         </div>
        //       </div>`,
      });
      count++;
    });

    let json_data = JSON.stringify({
      recordsTotal: totalFiltered,
      recordsFiltered: totalFiltered,
      data: data,
    });
    res.send(json_data);
  } catch (error) {
    console.log(error);
    return error;
  }
}



export async function edit_admission(req, res, next) {
  try {
    const admissionId = req.query.Id;
    const admissionData = await studentModel.findById(admissionId);
    res.locals.message = req.flash();
    res.render("admission/editAdmission", {
      sessiondata: req.session.data,
      data: admissionData
    });
  } catch (error) {
    req.flash("error", "..server error..");
    res.redirect("/");
  }
}

export async function edit_admission_data(req, res, next) {
  try {
    const admissionId = req.query.id;
    const admissionData = await studentModel.findById(admissionId)
    if (!admissionData) {
      req.flash("error", "Admission not found");
      res.redirect("/view_all_admission");
    }
    let admission = await admissionModel.findOne({ admission_number: admissionData?.studentId })

    if (req.file) {
      req.body.image = `${req.file.fieldname}/${req.file.filename}`;
    }
    req.body.subjects = JSON.parse(req.body.subjects)
    Object.assign(admission, req.body);
    await admission.save();
    await studentModel.findByIdAndUpdate(admissionId, req.body, { new: true });
    req.flash("success", "Admission updated successfully.");
    res.redirect("/view_all_admission");
  } catch (error) {
    console.log(error)
    req.flash("error", "..server error..");
    res.redirect("/");
  }
}