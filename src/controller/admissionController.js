import branchModel from "../module/branchModel.js"
import AdmissionModel from "../module/admissionModel.js"
import courseModel from "../module/courseModel.js";
import jwt from "jsonwebtoken";
import transactionModel from "../module/transactionModel.js";
import studentModel from "../module/studentModel.js";
import mongoose from "mongoose";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import randomstring from "randomstring";
import path from 'path';
import moment from "moment";
import userModel from "../module/userModel.js";
import admissionModel from "../module/admissionModel.js";
async function getUserFromToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return await branchModel.findById(decoded.id, {
            branch_name: 1,
            branch_code: 1,
            userbalance: 1
        });
    } catch (error) {
        console.error("Error decoding token:", error.message);
        return null;
    }
}


export async function admission(req, res) {
    try {
        res.locals.message = req.flash();
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        let branch = await branchModel.findOne({ _id: req.user.id });
        let course = await courseModel.find({})
        course = JSON.stringify(course);
        return res.render("branch/admission", { data: user, branch, course });
    } catch (error) {
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}



export async function admissionData(req, res, next) {
    try {
        const { id } = req.user;
        const { royalti_fees, course_code, branch_code, course_name, admission_date, dob } = req.body;

        // Fetch required data in parallel
        const [branchData, courseData, admissionCount] = await Promise.all([
            branchModel.findById(id, { userbalance: 1, _id: 1, referedBy: 1 }),
            courseModel.findOne({ course_code }, { _id: 1 }),
            AdmissionModel.countDocuments({})
        ]);
        // Check user balance
        if (!branchData || branchData.userbalance.balance < royalti_fees) {
            req.flash("error", "Insufficient Balance");
            return res.redirect("admission");
        }

        // Prepare request body
        req.body.branchId = branchData._id;
        req.body.courseId = courseData?._id;
        req.body.image = req.file ? `${req.file.fieldname}/${req.file.filename}` : undefined;
        req.body.branch_code = typeof branch_code === "string" ? branch_code.toLowerCase() : branch_code;
        req.body.course_name = typeof course_name === "string" ? course_code.toLowerCase() : course_name;

        // Format dates
        if (admission_date) {
            const [year, month, day] = admission_date.split('-');
            req.body.admission_date = `${day}-${month}-${year}`;
            const admissionNumber = `${req.body.branch_code.toUpperCase()}/${req.body.course_name.toUpperCase()}/${year}/${String(admissionCount + 1).padStart(4, '0')}`;
            req.body.admission_number = admissionNumber;
            req.body.studentId = admissionNumber;
        }

        if (dob) {
            const [year, month, day] = dob.split('-');
            req.body.dob = `${day}-${month}-${year}`;
        }

        // Save Admission & Student Data
        const admission = await new AdmissionModel(req.body).save();
        req.body.admissionId = admission._id;
        req.body.total_paid = Number(royalti_fees);

        const student = await studentModel.create(req.body);

        // Create Transaction Entry
        const txnid = `trx-${Date.now()}${randomstring.generate({ length: 4, charset: 'alphabetic', capitalization: 'uppercase' })}`;
        await new transactionModel({
            userid: id,
            admission_id: admission._id,
            student_id: student._id,
            transaction_id: txnid,
            amount: royalti_fees,
            type: "ADMISSION FEES",
            status: "completed"
        }).save();

        // Update Branch Balance & Admission Stats
        await branchModel.findByIdAndUpdate(id, {
            $inc: {
                "userbalance.balance": -royalti_fees,
                totelAdmission: 1,
                totelAdmissionAmount: royalti_fees
            }
        }, { new: true });
        if (branchData.referedBy) {
            const referedByBranch = await userModel.findById(branchData.referedBy);
            let commission = (royalti_fees * +referedByBranch?.percentage) / 100;

            referedByBranch.userbalance.balance += commission
            referedByBranch.userbalance.withdrawal_balance += commission
            referedByBranch.save();

            const txnid = `trx-${Date.now()}${randomstring.generate({ length: 4, charset: 'alphabetic', capitalization: 'uppercase' })}`;
            await new transactionModel({
                userid: referedByBranch._id,
                admission_id: admission._id,
                student_id: student._id,
                transaction_id: txnid,
                amount: commission,
                type: "ADMISSION COMMISSION",
                status: "completed"
            }).save();


        }
        req.flash("success", "Admission Form successfully submitted.");
        res.redirect("admission");

    } catch (error) {
        console.error("Error in admissionData:", error.message);
        req.flash("error ", "Something went wrong");
        return res.redirect("admission");
    }

}


export async function viewAdmissions(req, res, next) {
    try {
        let admissions = await AdmissionModel.aggregate(
            [
                {
                    $match: {
                        branch_code: req.user.branch_code.toLowerCase()
                    }
                },
                {
                    $lookup: {
                        from: "transactions",
                        localField: "_id",
                        foreignField: "admission_id",
                        as: "result"
                    }
                },
                {
                    $unwind: {
                        path: "$result",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "students",
                        localField: "admission_number",
                        foreignField: "studentId",
                        as: "student"
                    }
                },
                {
                    $unwind: {
                        path: "$student",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $match: {
                        "student.certificate_required": false,
                    }
                },
                {
                    $lookup: {
                        from: "courses",
                        localField: "student.courseId",
                        foreignField: "_id",
                        as: "courses"
                    }
                },
                {
                    $unwind: {
                        path: "$courses",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        branch_code: 1,
                        branch_name: 1,
                        course_name: 1,
                        course_code: 1,
                        royalti_fees: 1,
                        course_duration: 1,
                        student_name: 1,
                        admission_date: 1,
                        dob: 1,
                        total_paid: "$student.total_paid",
                        exam_idpaid: "$student.exam_ispaid",
                        studentId: "$student._id",
                        marks_enrollment: "$student.marks_enrollment",
                        certificate_issued: "$student.certificate_issued",
                        mobile: 1,
                        image: 1,
                        admission_number: 1,
                        amountPaid: "$result.amount",
                        paymentstatus: "$result.paymentstatus",
                        subjects: "$courses.subjects",
                        student_subject: "$student.subjects"

                    }
                }

            ])
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        return res.render("branch/viewAdmissions", { admissions, data: user });
    } catch (error) {
        console.error("Error in viewAdmissions:", error.message);
        req.flash("error", "..server error..");
        res.redirect("/");
    }

}


export async function addStudentMark(req, res, next) {
    try {
        if (req.body.admission_number) {
            const student = await studentModel.findOne({ studentId: req.body.admission_number });
            const count_sl = await studentModel.countDocuments({ sl_no: { $exists: true, $ne: "" } });
            console.log(count_sl, "count_sl")
            let sl_no = 1000 + count_sl + 1;
            if (student) {
                student.subjects = req.body.subjects;
                student.marks_enrollment = true;
                student.sl_no = sl_no;
                await student.save();
                res.status(200).json({
                    status: true,
                    message: "Student marks added successfully"
                })

            } else {
                res.status(404).json({
                    status: false,
                    message: "Student not found"
                })
            }

        }
    } catch (error) {
        console.error("Error in addStudentMark:", error.message);
        res.status(500).json({
            status: false,
            message: "Server error"
        })

    }

}

export async function payExamFee(req, res, next) {
    try {
        const { admissionNumber } = req.body;
        if (!admissionNumber) return res.status(400).json({ status: false, message: "Admission number is required" });

        // Fetch student and branch details in parallel
        const student = await studentModel.findOne({ studentId: admissionNumber }).populate("courseId");
        if (!student) {
            return res.status(404).json({ status: false, message: "Student not found" });
        }
        if (student.exam_ispaid) {
            return res.status(200).json({ status: false, message: "Exam fee already paid" });
        }

        const branch = await branchModel.findById(student.branchId);
        if (!branch) {
            return res.status(404).json({ status: false, message: "Branch not found" });
        }

        const examFees = Number(student.courseId?.exam_fees || 0);
        if (branch.userbalance.balance < examFees) {
            return res.status(400).json({ status: false, message: "Insufficient balance" });
        }

        // Update Student & Branch Balance
        student?.roll_no = Math.floor(1000 + Math.random() * 9000);
        student?.total_paid += examFees;
        student?.exam_ispaid = true;
        branch?.userbalance.balance -= examFees;

        await Promise.all([student.save(), branch.save()]);

        // Generate Transaction
        const txnid = `trx-${Date.now()}${randomstring.generate({ length: 4, charset: 'alphabetic', capitalization: 'uppercase' })}`;
        await new transactionModel({
            userid: req.user.id,
            student_id: student._id,
            transaction_id: txnid,
            amount: examFees,
            type: "EXAM FEES",
            status: "completed",
        }).save();

        return res.status(200).json({
            status: true,
            message: "Exam fee paid successfully",
            data: {
                admissionNumber: student.studentId,
                examFees,
                transactionId: txnid,
            },
        })
    } catch (error) {
        console.error("Error in addStudentMark:", error.message);
        return res.status(500).json({
            status: false,
            message: "Server error"
        })

    }

}




export async function requestCertificates(req, res, next) {
    try {
        if (req.query.student) {
            const student = await studentModel.findOne({ studentId: req.query.student });
            if (student) {
                student.certificate_required = true;
                await student.save();
                req.flash("success", "Certificate request submitted successfully");
                return res.redirect("view-request_certificates");

            } else {
                req.flash("error", "Student not found");
                return res.redirect("viewAdmissions");

            }
        }
        req.flash("error", "Something went wrong");
        return res.redirect("viewAdmissions");
    }
    catch (error) {
        req.flash("error", "Internal server error");
        return res.redirect("viewAdmissions");

    }
}

export async function viewRequestCertificates(req, res, next) {
    try {
        res.locals.message = req.flash();
        let admissions = await studentModel.find({ certificate_required: true, certificate_issued: false });
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        return res.render("branch/viewRequestCertificates", { admissions, data: user });

    }
    catch (error) {
        console.error("Error in requestCertificates:", error.message);
        res.status(500).json({
            status: false,
            message: "Server error"
        })

    }
}
export async function passStudent(req, res, next) {
    try {
        res.locals.message = req.flash();
        let admissions = await studentModel.find({ certificate_required: true, certificate_issued: true });
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        return res.render("branch/passedStudent", { admissions, data: user });

    }
    catch (error) {
        console.error("Error in requestCertificates:", error.message);
        res.status(500).json({
            status: false,
            message: "Server error"
        })

    }
}


export async function StudentReceipt(req, res, next) {
    try {
        if (!req.params.id) {
            req.flash("error", "User Not Found!");
            return res.redirect("student-login");
        }
        let user = await studentModel.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.params.id)
                }
            },
            {
                $lookup: {
                    from: "admissions",
                    localField: "admissionId",
                    foreignField: "_id",
                    as: "admission"
                }
            },
            {
                $unwind: {
                    path: "$admission",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "branches",
                    localField: "branchId",
                    foreignField: "_id",
                    as: "branches"
                }
            },
            {
                $unwind: {
                    path: "$branches",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "courses",
                    localField: "courseId",
                    foreignField: "_id",
                    as: "course"
                }
            },
            {
                $unwind: {
                    path: "$course",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    student_name: 1,
                    father_name: 1,
                    mother_name: 1,
                    dob: 1,
                    gender: 1,
                    qualification: 1,
                    nationality: 1,
                    mobile: 1,
                    address: 1,
                    dist: 1,
                    state: 1,
                    pincode: 1,
                    state: 1,
                    image: 1,
                    studentId: 1,
                    admission_date: "$admission.admission_date",
                    branch_name: "$branches.branch_name",
                    branch_code: "$branches.branch_code",
                    directore_name: "$branches.directore_name",
                    branch_directore_mob: "$branches.directore_mob",
                    course_name: "$course.course_name",
                    course_code: "$course.course_code",
                    course_duration: "$course.duration",
                    admission_fees: "$course.admission_fees",

                }
            }
        ]);
        user = user[0]
        if (!user) {
            req.flash("error", "User Not Found!");
            return res.redirect("student-login");
        }
        const templateBytes = fs.readFileSync('public/recipt.png');
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]); // A4 size

        const templateImage = await pdfDoc.embedPng(templateBytes);
        page.drawImage(templateImage, {
            x: 0,
            y: 0,
            width: 595,
            height: 842,
        });

        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        page.setFont(font);
        page.setFontSize(12);
        page.setFontColor(rgb(0, 0, 0));

        const formData = {
            'Enrollment Number': user.studentId,
            'Date of Registration': user.admission_date,
            'Auth Study Center': user.branch_name.toUpperCase(),
            'Center Code': user.branch_code.toUpperCase(),
            'Course Name': user.course_name,
            'Course Duration': user.course_duration,
            'Student Name': user.student_name,
            'Father Name': user.father_name,
            'Mother Name': user.mother_name,
            'D.O.B': user.dob,
            'Gender': user.gender.toUpperCase(),
            'Qualification': user.qualification,
            'Nationality': user.nationality,
            'State': user.state,
            'District': user.dist,
            'Address': user.address,
            'PIN': user.pincode,
            'Mobile': user.mobile,
        };
        const positions = [
            [50, 700], [400, 575], [50, 675], [50, 650], [50, 625], [400, 550],
            [50, 600], [50, 575], [50, 550], [50, 525], [50, 500], [50, 475],
            [50, 450], [50, 425], [50, 400], [50, 375], [50, 350], [50, 325],
        ];
        Object.entries(formData).forEach(([key, value], index) => {
            if (positions[index]) {
                const [x, y] = positions[index];
                page.drawText(`${key}: ${value}`, { x, y: y - 100 });
            }
        });
        let path = `public/${user.image}`
        console.log(path)
        if (fs.existsSync(path)) { // Ensure the photo file exists
            const studentPhotoBytes = fs.readFileSync(path);
            const fileExtension = path.split('.').pop().toLowerCase(); // Extract file extension
            let studentPhoto;
            fileExtension == "png" ? studentPhoto = await pdfDoc.embedPng(studentPhotoBytes) :
                studentPhoto = await pdfDoc.embedJpg(studentPhotoBytes); // or embedPng() if PNG
            page.drawImage(studentPhoto, {
                x: 450, // Adjust position as needed
                y: 500, // Adjust position as needed
                width: 100, // Adjust size as needed
                height: 120, // Adjust size as needed
            });
        }

        page.drawText('Your registration is successful. Congratulations!', { x: 125, y: 100, font, size: 14, color: rgb(0, 0, 1) });
        const pdfBytes = await pdfDoc.save();
        res.setHeader('Content-Disposition', `inline; filename="${user.studentId}/registration_receipt.pdf"`);
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.log(error)
        req.flash("error", "Internal Server Error");
        return res.redirect("student-login");
    }
}

export async function studentRequests(req, res, next) {
    try {
        res.locals.message = req.flash();

        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        return res.render("branch/studentRequest", { data: user });
    } catch (error) {
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}


export async function generateStudentCertificate(req, res, next) {
    try {
        let { studentId } = req.body;
        studentId = studentId.trim()
        if (!studentId) {
            return res.status(403).json({
                status: false,
                message: "Student ID is required"

            })
        }
        let admission = await studentModel.aggregate([
            {
                $match: {
                    studentId: studentId
                }
            },
            {
                $lookup: {
                    from: "branches",
                    localField: "branchId",
                    foreignField: "_id",
                    as: "branch"
                }
            },
            {
                $unwind: {
                    path: "$branch",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "courses",
                    localField: "courseId",
                    foreignField: "_id",
                    as: "course"
                }
            },
            {
                $unwind: {
                    path: "$course",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    student_name: 1,
                    father_name: 1,
                    studentId: 1,
                    image: 1,
                    subjects: 1,
                    dob: 1,
                    sl_no: 1,
                    branch_name: "$branch.branch_name",
                    directore_name: "$branch.directore_name",
                    course_name: "$course.course_name",
                    course_code: "$course.course_code",
                    duration: "$course.duration",

                }
            }


        ])
        admission = admission[0]
        let percentage
        let grade
        let division
        let subjects = admission.subjects;
        if (admission && admission.subjects.length > 0) {
            let totalMarks = 0;
            let subjectMark = 0;
            subjects.forEach((subject, index) => {
                totalMarks += +subject?.OM;
                subjectMark += +subject?.OM
            });


            // Calculate percentage and grade
            percentage = (totalMarks / subjectMark) * 100;
            grade = percentage >= 75 ? "A" : percentage >= 51 ? "B" : percentage >= 30 ? "C" : "Try Again";
            division = percentage >= 60 ? "First" : percentage >= 50 ? "Second" : "Third";

        }
        const certificateData = {
            name: admission.student_name.toUpperCase(),
            fatherName: admission.father_name.toUpperCase(),
            course: admission.course_name.toUpperCase(),
            regNumber: admission.studentId,
            dob: admission.dob,
            duration: `${admission.duration} MONTHS`,
            grade: grade || "N/A",
            division: division || "N/A",
            studyCenter: admission.branch_name.toUpperCase(),
            issueDate: moment().format("DD-MM-YYYY"),
            sl_no: admission.sl_no || "N/A",
        };




        // Load the certificate template (PNG Image)
        const templateBytes = fs.readFileSync('public/certificte.jpg');

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([842, 1191]); // A4 size
        const { width, height } = page.getSize();

        // Embed the image
        // const image = await pdfDoc.embedPng(templateBytes);
        const image = await pdfDoc.embedJpg(templateBytes);
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: width,
            height: height
        });

        // Load a font
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Draw dynamic text
        page.drawText(certificateData.sl_no, { x: 170, y: 802, size: 14, font, color: rgb(0, 0, 0) });
        page.drawText(certificateData.name, { x: 360, y: 760, size: 18, font, color: rgb(0, 0, 0) });
        page.drawText(certificateData.fatherName, { x: 250, y: 710, size: 14, font, color: rgb(0, 0, 0) });
        page.drawText(certificateData.course, { x: 230, y: 660, size: 14, font, color: rgb(0, 0, 0) });
        page.drawText(certificateData.regNumber, { x: 230, y: 610, size: 14, font, color: rgb(0, 0, 0) });
        page.drawText(certificateData.dob, { x: 230, y: 560, size: 14, font, color: rgb(0, 0, 0) });
        page.drawText(certificateData.duration, { x: 550, y: 560, size: 14, font, color: rgb(0, 0, 0) });
        page.drawText(certificateData.grade, { x: 250, y: 505, size: 14, font, color: rgb(0, 0, 0) });
        page.drawText(certificateData.division, { x: 500, y: 505, size: 14, font, color: rgb(0, 0, 0) });
        page.drawText(certificateData.studyCenter, { x: 230, y: 450, size: 14, font, color: rgb(0, 0, 0) });
        page.drawText(`Date Of Issue :- ${certificateData.issueDate}`, { x: 70, y: 130, size: 12, font, color: rgb(0, 0, 0) });

        const imagePath = `public/${admission?.image}`;
        let imageExe = imagePath.split(".").pop();

        if (fs.existsSync(imagePath)) {
            const photoBytes = fs.readFileSync(imagePath);
            let studentPhoto
            if (imageExe == "png") {
                studentPhoto = await pdfDoc.embedPng(photoBytes);
            } else {
                studentPhoto = await pdfDoc.embedJpg(photoBytes);
            }

            // Place the image on the top-right corner
            page.drawImage(studentPhoto, {
                x: 630, // Adjust X position
                y: 950, // Adjust Y position
                width: 140,
                height: 140,
            });
        }
        // Save the PDF and send it as a response
        const pdfBytes = await pdfDoc.save();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="certificate.pdf"');
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.log(error);
        req.flash("error", "Internal Server Error");
        return res.redirect("login");
    }
}



export async function generateStudentMarkSheet(req, res, next) {
    try {
        let { studentId } = req.body;
        studentId = studentId.trim()
        if (!studentId) {
            return res.status(403).json({
                status: false,
                message: "Student ID is required"

            })
        }
        let data = await studentModel.aggregate([
            {
                $match: {
                    studentId: studentId
                }
            },
            {
                $lookup: {
                    from: "branches",
                    localField: "branchId",
                    foreignField: "_id",
                    as: "branch"
                }
            },
            {
                $unwind: {
                    path: "$branch",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "courses",
                    localField: "courseId",
                    foreignField: "_id",
                    as: "course"
                }
            },
            {
                $unwind: {
                    path: "$course",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    student_name: 1,
                    father_name: 1,
                    studentId: 1,
                    image: 1,
                    subjects: 1,
                    sl_no: 1,
                    branch_name: "$branch.branch_name",
                    directore_name: "$branch.directore_name",
                    course_name: "$course.course_name",
                    course_code: "$course.course_code",
                    duration: "$course.duration",

                }
            }


        ])
        data = data[0];
        // Load marksheet background
        const existingPdfBytes = fs.readFileSync("public/marksheet.jpg");
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]); // A4 Size

        // Embed marksheet background
        const bgImage = await pdfDoc.embedJpg(existingPdfBytes);
        page.drawImage(bgImage, { x: 0, y: 0, width: 595, height: 842 });

        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Student Details (Modify these based on request data)
        const studentName = data?.student_name.toUpperCase();
        const studentRegNo = data?.studentId;
        const fatherName = data?.father_name.toUpperCase();
        const courseName = data?.course_name.toUpperCase();
        const duration = `${data?.duration} MONTHS`;
        const studyCenter = data?.branch_name.toUpperCase();
        const sl_no = data?.sl_no || "N/A";

        page.drawText(`${sl_no}`, { x: 495, y: 653, size: 8, font });
        page.drawText(`${studentRegNo}`, { x: 300, y: 609, size: 12, font });
        page.drawText(`${studentName}`, { x: 300, y: 582, size: 12, font });
        page.drawText(`${fatherName}`, { x: 300, y: 557, size: 12, font });
        page.drawText(`${courseName}`, { x: 300, y: 530, size: 12, font });
        page.drawText(`${duration}`, { x: 300, y: 502, size: 12, font });
        page.drawText(`${studyCenter}`, { x: 300, y: 475, size: 12, font });



        // Embed Student Photo (if uploaded)
        const imagePath = `public/${data?.image}`;
        let imageExe = imagePath.split(".").pop();
        if (fs.existsSync(imagePath)) {
            const photoBytes = fs.readFileSync(imagePath);
            let studentPhoto
            if (imageExe == "png") {
                studentPhoto = await pdfDoc.embedPng(photoBytes);
            } else {
                studentPhoto = await pdfDoc.embedJpg(photoBytes);
            }
            // Place the image on the top-right corner
            page.drawImage(studentPhoto, {
                x: 440, // Adjust X position
                y: 680, // Adjust Y position
                width: 100,
                height: 100,
            });
        }


        if (data && data.subjects.length > 0) {
            const subjects = data.subjects;
            const startY = 380;
            const totalSubjects = subjects.length;
            const rowHeight = Math.max(15, Math.min(25, 180 / totalSubjects)); // Dynamic row height
            let yPos = startY;
            let totalMarks = 0;
            let subjectMarks = 0;
            let totalPM = 0;
            let totalFM = 0;
            let totalOM = 0;
            subjects.forEach((subject, index) => {
                totalPM += +subject?.PM;
                totalFM += +subject?.FM;
                totalOM += +subject?.OM;

                page.drawText(`${index + 1}`, { x: 50, y: yPos, size: 10, font });
                page.drawText(subject?.subjectName.toUpperCase(), { x: 90, y: yPos, size: 10, font });
                page.drawText(subject?.PM, { x: 340, y: yPos, size: 10, font });
                page.drawText(subject?.FM, { x: 400, y: yPos, size: 10, font });
                page.drawText(`${subject?.OM}`, { x: 500, y: yPos, size: 10, font });

                totalMarks += +subject?.OM;
                subjectMarks += +subject?.FM
                yPos -= rowHeight;
            });

            // Calculate percentage and grade
            let percentage = (totalMarks / subjectMarks) * 100;
            let grade = percentage >= 75 ? "A" : percentage >= 51 ? "B" : percentage >= 30 ? "C" : "Try Again";
            let division = percentage >= 60 ? "First" : percentage >= 50 ? "Second" : "Third";
            let footer = 183
            page.drawText(`${totalPM}`, { x: 340, y: 210, size: 10, font });
            page.drawText(`${totalFM}`, { x: 400, y: 210, size: 10, font });
            page.drawText(`${totalOM}`, { x: 500, y: 210, size: 10, font });


            page.drawText(`${percentage.toFixed(2)}%`, { x: 120, y: footer, size: 12, font });
            page.drawText(`${grade}`, { x: 260, y: footer, size: 12, font });
            page.drawText(`${division}`, { x: 420, y: footer, size: 12, font });

        }
        // Save and send the PDF as response
        const pdfBytes = await pdfDoc.save();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'attachment; filename="Marksheet.pdf"');
        res.end(Buffer.from(pdfBytes));

    } catch (error) {
        console.log(error);
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}
