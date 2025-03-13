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
                    <a href="/download-certificate?studentId=${index.studentId}" style="cursor: pointer;" >Download Certificate</a>
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
        let { studentId } = req.query;
        let admission = await admissionModel.findOne({ admission_number: studentId })
        const certificateData = {
            name: admission.student_name.toUpperCase(),
            fatherName: admission.father_name.toUpperCase(),
            course: admission.course_name.toUpperCase(),
            regNumber: admission.admission_number,
            dob: admission.dob,
            duration: `${admission.course_duration} Months`,
            grade: " N/A" || "N/A",
            division: " N/A " || "N/A",
            studyCenter: admission.branch_name.toUpperCase(),
            issueDate: moment().format("DD-MM-YYYY"),
        };

        // Load the certificate template (PNG Image)
        const templateBytes = fs.readFileSync('public/certificte.png');

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([842, 1191]); // A4 size
        const { width, height } = page.getSize();

        // Embed the image
        const image = await pdfDoc.embedPng(templateBytes);
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: width,
            height: height
        });

        // Load a font
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Draw dynamic text
        page.drawText(certificateData.name, { x: 340, y: 790, size: 18, font, color: rgb(0, 0, 0) });
        page.drawText(certificateData.fatherName, { x: 250, y: 740, size: 14, font, color: rgb(0, 0, 0) });
        page.drawText(certificateData.course, { x: 230, y: 695, size: 14, font, color: rgb(0, 0, 0) });
        page.drawText(certificateData.regNumber, { x: 230, y: 650, size: 14, font, color: rgb(0, 0, 0) });
        page.drawText(certificateData.dob, { x: 230, y: 590, size: 14, font, color: rgb(0, 0, 0) });
        page.drawText(certificateData.duration, { x: 550, y: 590, size: 14, font, color: rgb(0, 0, 0) });
        page.drawText(certificateData.grade, { x: 230, y: 540, size: 14, font, color: rgb(0, 0, 0) });
        page.drawText(certificateData.division, { x: 550, y: 540, size: 14, font, color: rgb(0, 0, 0) });
        page.drawText(certificateData.studyCenter, { x: 230, y: 490, size: 14, font, color: rgb(0, 0, 0) });
        page.drawText(`Date Of Issue :- ${certificateData.issueDate}`, { x: 30, y: 130, size: 18, font, color: rgb(0, 0, 0) });


        // Save the PDF and send it as a response
        const pdfBytes = await pdfDoc.save();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="certificate.pdf"');
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.log(error);
        req.flash("error", "Internal Server Error");
        return res.redirect("login");
    }
}