import depositModel from "../../module/depositModel.js";
import transactionModel from "../../module/transactionModel.js";
import userModel from "../../module/userModel.js";
import moment from "moment";
import mongoose from "mongoose";
import branchModel from "../../module/branchModel.js";
import studentModel from "../../module/studentModel.js";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import admissionModel from "../../module/admissionModel.js";
export async function depositAmount(req, res, next) {
    try {
        res.locals.message = req.flash();
        const { status, apd_date, req_date, email, mobile } = req.query;
        res.render("verify/depositList", {
            pending: req.query,
            sessiondata: req.session.data,
            selectQuery: status,
            emailValue: email,
            mobileNo: mobile,
            req_date: req_date,
            apd_date: apd_date,
        });
    } catch (error) {
        req.flash("error", "Something went wrong please try again");
        res.redirect("/");
    }
}
export async function request_certificate(req, res, next) {
    try {
        res.locals.message = req.flash();
        const { status, apd_date, req_date, email, mobile } = req.query;
        res.render("verify/requestCertificate", {
            pending: req.query,
            sessiondata: req.session.data,
            selectQuery: status,
            emailValue: email,
            mobileNo: mobile,
            req_date: req_date,
            apd_date: apd_date,
        });
    } catch (error) {
        req.flash("error", "Something went wrong please try again");
        res.redirect("/");
    }
}

export async function deposit_amount_datatable(req, res, next) {
    try {
        let pipeline = [];
        pipeline.push({
            $lookup: {
                from: "branches",
                localField: "userId",
                foreignField: "_id",
                as: "userdata",
            },
        });
        pipeline.push({
            $unwind: {
                path: "$userdata",
            },
        });
        pipeline.push({
            $project: {
                _id: 1,
                amount: 1,
                image: 1,
                comment: 1,
                userTransactionId: 1,
                utr_number: 1,
                userId: 1,
                approveDate: 1,
                status: 1,
                paytm_number: 1,
                username: "$userdata.branch_name",
                email: "$userdata.branch_code",
                mobile: "$userdata.directore_mob",
                Requested_Date: {
                    $dateToString: {
                        format: "%Y-%m-%d %H-%M",
                        date: "$createdAt",
                    },
                }
            },
        });

        if (req.query.email) {
            pipeline.push({
                $match: {
                    email: { $regex: new RegExp(req.query.email.toLowerCase(), "i") },
                },
            });
        }
        if (req.query.mobile) {
            pipeline.push({
                $match: { mobile: Number(req.query.mobile) },
            });
        }
        if (req.query.apd_date) {
            let datestring = moment(req.query.apd_date).format("YYYY-MM-DD");
            pipeline.push({
                $match: { approveDate: datestring },
            });
        }
        if (req.query.req_date) {
            let datestring = moment(req.query.req_date).format("YYYY-MM-DD");
            pipeline.push({
                $match: { Requested_Date: datestring },
            });
        }
        if (req.query.status) {
            pipeline.push({
                $match: { status: req.query.status },
            });
        }

        // Use await instead of callback-based exec()
        let totalFiltered = await depositModel.countDocuments(pipeline).exec();
        let rows1 = await depositModel.aggregate(pipeline).exec();
        console.log(rows1);
        let data = [];
        let count = 1;
        for (let index of rows1) {
            let newappenField = "";
            let appendDate = `<span class="text-danger">Not Approved Yet</span>`;

            if (index.status !== 'approved') {
                newappenField = `
                    <a style="cursor: pointer;" data-toggle="tooltip dropdown-item" title="approve" 
                    onclick="confirmation('/approve-deposit-request/${index.userId}?depositId=${index._id}&amount=${index.amount}', 'Are you sure?')">
                        <span class="text-success"><i class="far fa-check-circle"></i>Approve</span>
                    </a>&nbsp&nbsp&nbsp
                    <a data-toggle="modal" data-target="#deductmoneymodal${index._id}" class="editbtn" style="cursor:pointer;">
                        <span class="text-danger"><i class="far fa-times-circle"></i>Reject</span>
                    </a>
                    <div id="deductmoneymodal${index._id}" class="modal fade abc px-0" role="dialog">
                        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable h-100">
                            <form action="/reject-deposit-request/${index.userId}?depositId=${index._id}&amount=${index.amount}" method="GET">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h4 class="modal-title _head_ing">Cancel Request</h4>
                                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                                    </div>
                                    <div class="modal-body">
                                        <input type="hidden" value="${index.userId}" name="userid">
                                        <input type="hidden" value="${index.amount}" name="amount">
                                        <input type="hidden" value="${index._id}" name="depositId">
                                        <div class="col-md-12 form-group">
                                            <label>Comment</label>
                                            <input type="text" class="form-control" id="description" name="description" required>
                                        </div>
                                    </div>
                                    <div class="modal-footer">
                                        <div class="col-auto text-right ml-auto mt-4 mb-2">
                                            <input type="submit" class="btn btn-sm btn-success text-uppercase" value="Submit">
                                            <button type="button" class="btn btn-sm btn-secondary" data-dismiss="modal">Close</button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>`;
            }

            if (index.approveDate) {
                appendDate = `<span class="text-success">${moment(index.approveDate).format("YYYY-MM-DD")}</span>`;
            }
            data.push({
                S_NO: count,
                user_Name: index.username,
                amount: index.amount || "",
                image: `<img src="${process.env.BASE_URL}${index.image}" class="w-40px view_team_table_images h-40px rounded-pill"/>` || "",
                Requested_Date: `<span class="text-warning">${moment(index.Requested_Date).format("YYYY-MM-DD HH:mm")}</span>`,
                Email: index.email || "",
                app_rej_Date: appendDate,
                Mobile: index.mobile || "",
                userTransactionId: index.userTransactionId,
                utr_number: index.utr_number || "",
                Admin_Comment: index.comment || "",
                status_description: index.status,
                actions: newappenField,
            });

            count++;
        }

        res.json({ data });

    } catch (error) {
        console.error(error);
        req.flash("error", "Something went wrong, please try again");
        res.redirect("/deposit_amount");
    }
}
export async function request_certificate_data(req, res, next) {
    try {
        let pipeline = [
            {
                $match: {
                    certificate_required: true,
                    certificate_issued: false
                }
            }
        ];

        if (req.query.email) {
            pipeline.push({
                $match: {
                    email: { $regex: new RegExp(req.query.email.toLowerCase(), "i") },
                },
            });
        }
        if (req.query.mobile) {
            pipeline.push({
                $match: { mobile: Number(req.query.mobile) },
            });
        }
        if (req.query.apd_date) {
            let datestring = moment(req.query.apd_date).format("YYYY-MM-DD");
            pipeline.push({
                $match: { approveDate: datestring },
            });
        }
        if (req.query.req_date) {
            let datestring = moment(req.query.req_date).format("YYYY-MM-DD");
            pipeline.push({
                $match: { Requested_Date: datestring },
            });
        }

        // Use await instead of callback-based exec()
        let totalFiltered = await studentModel.countDocuments(pipeline).exec();
        let rows1 = await studentModel.aggregate(pipeline).exec();
        let data = [];
        let count = 1;
        for (let index of rows1) {
            let newappenField = "";
            let appendDate = `<span class="text-danger">Not Approved Yet</span>`;

            if (index.status !== 'approved') {
                newappenField = `
                    <a style="cursor: pointer;" data-toggle="tooltip dropdown-item" title="approve" 
                    onclick="confirmation('/approve_certificate_request/${index._id}', 'Are you sure?')">
                        <span class="text-success"><i class="far fa-check-circle"></i>Approve</span>
                    </a>&nbsp&nbsp&nbsp
                    <a href="/download-certificate?studentId=${index.studentId}" target="_blank" style="cursor: pointer;" >Download Certificate</a> /
                    <a href="/generate_student_marksheet?studentId=${index.studentId}" target="_blank" style="cursor: pointer;" >Download Marksheet</a>
                    `;
            }

            if (index.approveDate) {
                appendDate = `<span class="text-success">${moment(index.approveDate).format("YYYY-MM-DD")}</span>`;
            }
            data.push({
                S_NO: count,
                user_Name: index.student_name,
                Requested_Date: `<span class="text-warning">${moment(index.Requested_Date).format("YYYY-MM-DD HH:mm")}</span>`,
                Mobile: index.mobile || "",
                actions: newappenField,
            });

            count++;
        }

        res.json({ data });

    } catch (error) {
        console.error(error);
        req.flash("error", "Something went wrong, please try again");
        res.redirect("/deposit_amount");
    }
}



export async function approve_deposit_request(req, res) {
    console.log(req.query);

    try {
        let { depositId, amount } = req.query;

        // Validate ObjectId
        if (!mongoose.isValidObjectId(depositId)) {
            return res.status(400).json({ status: false, message: "Invalid deposit ID." });
        }

        const pipeline = [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(depositId),
                    status: "pending",
                },
            },
            {
                $lookup: {
                    from: "branches",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userData",
                },
            },
            { $unwind: "$userData" },
        ];

        let result = await depositModel.aggregate(pipeline);

        if (result.length === 0) {
            req.flash("error", "something went wrong");
            return res.redirect("/deposit_amount");
        }

        let userDeposit = result[0];
        let user = userDeposit.userData;
        try {
            // Update user's balance
            const update = { $inc: { "userbalance.balance": Number(userDeposit.amount) } };
            await branchModel.findOneAndUpdate({ _id: user._id }, update, { new: true });

            // Update transaction status
            await transactionModel.findOneAndUpdate(
                { transaction_id: userDeposit.transaction_id },
                { paymentstatus: "confirmed" },
                { new: true }
            );

            // Approve deposit
            const updateDeposit = await depositModel.findOneAndUpdate(
                { _id: depositId },
                {
                    $set: {
                        approveDate: moment().format("YYYY-MM-DD HH:mm:ss"),
                        status: "approved",
                        comment: "approved",
                    },
                },
                { new: true }
            );

            if (!updateDeposit) {
                req.flash("error", "something went wrong");
                return res.redirect("/deposit_amount");
            }

            req.flash("success", "deposit request rejected");
            return res.redirect("/deposit_amount");

        } catch (error) {
            console.error("Error in deposit approval:", error);
            req.flash("error", "something went wrong");
            return res.redirect("/deposit_amount");
        }

    } catch (error) {
        console.error("Server error:", error);
        req.flash("error", "something went wrong");
        return res.redirect("/deposit_amount");
    }
}

export async function reject_deposit_request(req, res, next) {
    try {
        const updateDeposit = await depositModel.findOneAndUpdate({ _id: req.query.depositId }, { $set: { approveDate: moment().format("YYYY-MM-DD  HH:mm:ss"), status: 'rejected', comment: req.query.description } }, { new: true });
        await transactionModel.findOneAndUpdate({ transaction_id: updateDeposit.transaction_id }, { paymentstatus: "rejected", comment: req.query.description }, { new: true });
        req.flash("success", "deposit request rejected");
        return res.redirect("/deposit_amount");
    } catch (error) {
        req.flash("error", "something went wrong");
        return res.redirect("/deposit_amount");
    }
}



export async function approve_request_certificate(req, res) {
    try {
        await studentModel.findByIdAndUpdate(req.params.id, { certificate_issued: true });
        req.flash("success", "Certificate request approved");
        return res.redirect("/request_certificate");


    } catch (error) {
        console.error("Server error:", error);
        req.flash("error", "something went wrong");
        return res.redirect("/deposit_amount");
    }
}


export async function download_certificate(req, res, next) {
    try {
        let { studentId: studentId } = req.query;
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
                $lookup: {
                    from: "admissions",
                    localField: "studentId",
                    foreignField: "admission_number",
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
                $project: {
                    roll_no: 1,
                    student_name: 1,
                    father_name: 1,
                    studentId: 1,
                    image: 1,
                    subjects: 1,
                    dob: 1,
                    sl_no: 1,
                    branch_name: "$branch.branch_name",
                    directore_name: "$branch.directore_name",
                    course_name: "$course.course_code",
                    course_code: "$course.course_code",
                    duration: "$course.duration",
                    year: "$course.year",
                    admission_date: "$admission.admission_date"

                }
            }
        ])
        admission = admission[0]
        if (admission) {
            if (admission.course_code == "NTT") return await secondYearCertificate(admission, res)
        }
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
        admission.course_name = admission.course_name == undefined ? "" : admission.course_name.toUpperCase()

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
        const templateBytes = fs.readFileSync('public/certificate.png');

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([842, 1191]); // A4 size
        const { width, height } = page.getSize();

        // Embed the image
        const image = await pdfDoc.embedPng(templateBytes);
        // const image = await pdfDoc.embedJpg(templateBytes);
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



export async function secondYearCertificate(data, res) {
    try {
        const imageBytes = fs.readFileSync('public/certificate-2.png');
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([794, 1123]);

        const pngImage = await pdfDoc.embedPng(imageBytes);
        page.drawImage(pngImage, {
            x: 0,
            y: 0,
            width: 794,
            height: 1123,
        });

        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const fontSize = 14;
        const textColor = rgb(0, 0, 0);

        const year = data.admission_date.split("-")[2]
        const session = year + "-" + (+year + 1)

        // Text Coordinates based on visual placement
        page.drawText(session, { x: 400, y: 689, size: fontSize, font, color: textColor });
        page.drawText(data.student_name, { x: 250, y: 621, size: fontSize, font, color: textColor });
        page.drawText(data.father_name, { x: 230, y: 571, size: fontSize, font, color: textColor });
        page.drawText(data.roll_no.toString(), { x: 130, y: 801, size: 14, font, color: textColor });
        page.drawText(data.studentId, { x: 530, y: 801, size: 14, font, color: textColor });
        page.drawText(data.branch_name, { x: 120, y: 444, size: fontSize, font, color: textColor });
        page.drawText(data.course_name, { x: 120, y: 527, size: fontSize, font, color: textColor });

        // page.drawText(theorySubject, { x: 160, y: 322, size: fontSize, font, color: textColor });
        // page.drawText(practicalSubject, { x: 180, y: 240, size: fontSize, font, color: textColor });



        if (data && data.subjects.length > 0) {
            const subjects = data.subjects;
            const totalSubjects = subjects.length;
            let startY = 325;
            let totalMarks = 0;
            let subjectMarks = 0;
            let totalFM = 0;
            let totalOM = 0;


            let startYP = 240;
            let totalFMP = 0;
            let totalOMP = 0;
            let totalPmark = 0;
            let totalSubjectpMark = 0
            let count = 0
            let innertext = ""
            const theorySubjectArr = subjects.filter((sub) => sub.type == "theory")
            theorySubjectArr.forEach((subject, index) => {
                count++
                totalFM += +subject?.FM;
                totalOM += +subject?.OM;
                innertext = `${innertext} * ${subject?.subjectName.toUpperCase()}`
                if (count == 3 || index == theorySubjectArr.length - 1) {
                    page.drawText(innertext, { x: 160, y: startY, size: 10, font });
                    count = 0
                    innertext = ""
                    startY -= 15;
                }
                totalMarks += +subject?.OM;
                subjectMarks += +subject?.FM
            });

            let Pcount = 0
            let Pinnertext = ""
            const practicalSubjectArr = subjects.filter((sub) => sub.type == "practical")
            practicalSubjectArr.forEach((subject, index) => {
                Pcount++
                totalFMP += +subject?.FM;
                totalOMP += +subject?.OM;
                Pinnertext = `${Pinnertext} * ${subject?.subjectName.toUpperCase()}`
                if (Pcount == 3 || index == practicalSubjectArr.length - 1) {
                    page.drawText(Pinnertext, { x: 185, y: startYP, size: 10, font });
                    count = 0
                    Pinnertext = ""
                    startYP -= 15;

                }

                totalPmark += +subject?.OM;
                totalSubjectpMark += +subject?.FM
            });

            // Calculate percentage and grade
            let Tpercentage = (totalMarks / subjectMarks) * 100;
            let Tdivision = Tpercentage >= 60 ? "First" : Tpercentage >= 50 ? "Second" : "Third";
            page.drawText(Tdivision, { x: 250, y: 400, size: fontSize, font, color: textColor });


            let Ppercentage = (totalPmark / totalSubjectpMark) * 100;
            let Pdivision = Ppercentage >= 60 ? "First" : Ppercentage >= 50 ? "Second" : "Third";
            page.drawText(Pdivision, { x: 485, y: 400, size: fontSize, font, color: textColor });

        }


        // Date
        page.drawText(`:- ${new Date().toLocaleDateString()}`, { x: 260, y: 82, size: fontSize, font, color: textColor });

        const pdfBytes = await pdfDoc.save();
        res.setHeader('Content-Disposition', 'inline; filename=certificate.pdf');
        res.setHeader('Content-Type', 'application/pdf');
        res.end(Buffer.from(pdfBytes));

    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Server Error');
    }
}


export async function generateStudentMarkSheet(req, res, next) {
    try {
        let { studentId } = req.query;
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
                $lookup: {
                    from: "admissions",
                    localField: "studentId",
                    foreignField: "admission_number",
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
                $project: {
                    roll_no: 1,
                    student_name: 1,
                    father_name: 1,
                    studentId: 1,
                    image: 1,
                    subjects: 1,
                    sl_no: 1,
                    branch_name: "$branch.branch_name",
                    branch_code: "$branch.branch_code",
                    directore_name: "$branch.directore_name",
                    course_name: "$course.course_name",
                    course_code: "$course.course_code",
                    duration: "$course.duration",
                    year: "$course.year",
                    admission_date: "$admission.admission_date"

                }
            }
        ])
        data = data[0];
        if (data) {
            if (data.course_code == "NTT") return await secondYearMarkSheet(data, res)
        }
        // Load marksheet background
        const existingPdfBytes = fs.readFileSync("public/marksheet.png");
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]); // A4 Size

        // Embed marksheet background
        const bgImage = await pdfDoc.embedPng(existingPdfBytes);
        // const bgImage = await pdfDoc.embedJpg(existingPdfBytes);
        page.drawImage(bgImage, { x: 0, y: 0, width: 595, height: 842 });

        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        data.branch_name = data?.branch_name == undefined ? "" : data?.branch_name.toUpperCase()
        data.course_name = data?.course_name == undefined ? "" : data?.course_name.toUpperCase()

        // Student Details (Modify these based on request data)
        const studentName = data?.student_name.toUpperCase();
        const studentRegNo = data?.studentId;
        const fatherName = data?.father_name.toUpperCase();
        const courseName = data?.course_name.toUpperCase();
        const duration = `${data?.duration} MONTHS`;
        const studyCenter = data?.branch_name.toUpperCase();
        const sl_no = data?.sl_no || "N/A";

        page.drawText(`${sl_no}`, { x: 495, y: 653, size: 8, font });
        page.drawText(`${studentRegNo}`, { x: 300, y: 595, size: 9, font });
        page.drawText(`${studentName}`, { x: 300, y: 571, size: 9, font });
        page.drawText(`${fatherName}`, { x: 300, y: 547, size: 9, font });
        page.drawText(`${courseName}`, { x: 300, y: 525, size: 9, font });
        page.drawText(`${duration}`, { x: 300, y: 500, size: 9, font });
        page.drawText(`${studyCenter}`, { x: 300, y: 478, size: 9, font });



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


export async function secondYearMarkSheet(data, res) {
    try {
        const imageBytes = fs.readFileSync('public/marksheet-2.png');
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]);

        const pngImage = await pdfDoc.embedPng(imageBytes);
        page.drawImage(pngImage, {
            x: 0,
            y: 0,
            width: 595,
            height: 842
        });
        const year = data.admission_date.split("-")[2]
        const sesson = year + "-" + (+year + 1)


        // --- Header Fields ---
        page.drawText(`:- ${(data.branch_code).toUpperCase()}`, { x: 210, y: 632, size: 12, color: rgb(0, 0, 0) });
        page.drawText((data.roll_no).toString(), { x: 95, y: 586, size: 12, color: rgb(0, 0, 0) });
        page.drawText(data.studentId, { x: 375, y: 588, size: 10, color: rgb(0, 0, 0) });
        page.drawText(sesson, { x: 300, y: 515, size: 12, color: rgb(0, 0, 0) });
        page.drawText(data.student_name.toUpperCase(), { x: 90, y: 485, size: 12, color: rgb(0, 0, 0) });
        page.drawText(data.father_name, { x: 390, y: 484, size: 12, color: rgb(0, 0, 0) });
        page.drawText(data.branch_name.toUpperCase(), { x: 150, y: 447, size: 12, color: rgb(0, 0, 0) });
        page.drawText(data.course_name.toUpperCase(), { x: 140, y: 425, size: 12, color: rgb(0, 0, 0) });
        page.drawText(`:- ${moment().format("DD-MM-YYYY")}`, { x: 195, y: 66, size: 12, color: rgb(0, 0, 0) });

        // --- Subjects ---
        const startY = 350;
        const rowHeight = 15;
        const font = 6.5;

        const theorySubjects = data.subjects.filter(subject => subject?.type == "theory");
        const totalOM = theorySubjects.reduce((acc, subject) => acc + +(subject?.OM || 0), 0);
        const totalFM = theorySubjects.reduce((acc, subject) => acc + +(subject?.FM || 0), 0);
        const theoryPercent = Math.floor(+totalOM / +totalFM * 100)
        let theoryDivision;
        let theoryGrade;
        if (theoryPercent >= 33 && theoryPercent <= 44) {
            theoryDivision = "C"
            theoryGrade = "THIRD"
        } else if (theoryPercent >= 45 && theoryPercent <= 59) {
            theoryDivision = "B"
            theoryGrade = "SECOND"
        } else if (theoryPercent >= 60 && theoryPercent <= 100) {
            theoryDivision = "A"
            theoryGrade = "FIRST"
        }
        for (let i = 0; i < theoryGrade.length; i++) {
            page.drawText(theoryGrade[i].toUpperCase(), { x: 270, y: 340 - 15 * i, size: font, color: rgb(0, 0, 0) });
        }

        theorySubjects.forEach((item, index) => {
            const y = startY - index * rowHeight;
            let subPercent = Math.floor(+item.OM / +item.FM * 100)
            let devision;
            if (subPercent >= 33 && subPercent <= 44) {
                devision = "C"
            } else if (subPercent >= 45 && subPercent <= 59) {
                devision = "B"
            } else if (subPercent >= 60 && subPercent <= 100) {
                devision = "A"
            }

            page.drawText(String(index + 1), { x: 50, y, size: font, color: rgb(0, 0, 0) });
            page.drawText(item.subjectName.toUpperCase(), { x: 66, y, size: font, color: rgb(0, 0, 0) });
            page.drawText(item.FM, { x: 210, y, size: font, color: rgb(0, 0, 0) });
            page.drawText(item.OM, { x: 240, y, size: font, color: rgb(0, 0, 0) });
            // page.drawText(devision, { x: 270, y, size: font, color: rgb(0, 0, 0) });

        });

        const practicalSubjects = data.subjects.filter(subject => subject?.type == "practical");
        const totalFMP = practicalSubjects.reduce((acc, subject) => acc + +(subject?.FM || 0), 0);
        const totalOMP = practicalSubjects.reduce((acc, subject) => acc + +(subject?.OM || 0), 0);
        const practicalPercent = Math.floor(+totalOMP / +totalFMP * 100)
        let practicalDivision;
        let practicalGrade;
        if (practicalPercent >= 33 && practicalPercent <= 44) {
            practicalDivision = "C"
            practicalGrade = "THIRD"
        } else if (practicalPercent >= 45 && practicalPercent <= 59) {
            practicalDivision = "B"
            practicalGrade = "SECOND"
        } else if (practicalPercent >= 60 && practicalPercent <= 100) {
            practicalDivision = "A"
            practicalGrade = "FIRST"
        }
        for (let i = 0; i < practicalGrade.length; i++) {
            page.drawText(practicalGrade[i].toUpperCase(), { x: 530, y: 340 - 15 * i, size: font, color: rgb(0, 0, 0) });
        }

        practicalSubjects.forEach((item, index) => {
            const y = startY - index * rowHeight;
            let subPercent = Math.floor(+item.OM / +item.FM * 100)
            let devision;
            if (subPercent >= 33 && subPercent <= 44) {
                devision = "C"
            } else if (subPercent >= 45 && subPercent <= 59) {
                devision = "B"
            } else if (subPercent >= 60 && subPercent <= 100) {
                devision = "A"
            }
            page.drawText(item.subjectName.toUpperCase(), { x: 300, y, size: font, color: rgb(0, 0, 0) });
            page.drawText(item.FM, { x: 460, y, size: font, color: rgb(0, 0, 0) });
            page.drawText(item.OM, { x: 490, y, size: font, color: rgb(0, 0, 0) });
            // page.drawText(devision, { x: 525, y, size: font, color: rgb(0, 0, 0) });
        });



        const totalMarksYIndex = 212;
        page.drawText(totalFMP.toString(), { x: 460, y: totalMarksYIndex, size: font, color: rgb(0, 0, 0) });
        page.drawText(totalOMP.toString(), { x: 490, y: totalMarksYIndex, size: font, color: rgb(0, 0, 0) });
        page.drawText(practicalDivision, { x: 524, y: totalMarksYIndex, size: font, color: rgb(0, 0, 0) });
        page.drawText(totalFM.toString(), { x: 210, y: totalMarksYIndex, size: font, color: rgb(0, 0, 0) });
        page.drawText(totalOM.toString(), { x: 236, y: totalMarksYIndex, size: font, color: rgb(0, 0, 0) });
        page.drawText(theoryDivision, { x: 270, y: totalMarksYIndex, size: font, color: rgb(0, 0, 0) });


        const pdfBytes = await pdfDoc.save();
        res.setHeader('Content-Disposition', 'inline; filename=marksheet.pdf');
        res.setHeader('Content-Type', 'application/pdf');
        res.end(Buffer.from(pdfBytes));

    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Server Error');
    }
}
