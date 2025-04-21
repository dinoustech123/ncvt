import jwt from "jsonwebtoken";
import branchModel from "../module/branchModel.js";
import transactionModel from "../module/transactionModel.js";
import mongoose from "mongoose";

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


export async function branch_dashboard(req, res) {
    try {
        res.locals.message = req.flash();
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        return res.render("branch/dashboard", { data: user });
    } catch (error) {
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}

export async function addpayments(req, res) {
    try {
        res.locals.message = req.flash();

        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        return res.render("branch/add-payments", { data: user });
    } catch (error) {
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}


export async function viewTransictions(req, res, next) {
    try {
        res.locals.message = req.flash();
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        const transaction = await transactionModel.aggregate([
            {
                $match: {
                    userid: new mongoose.Types.ObjectId(req.user.id),
                }
            },
            {
                $lookup: {
                    from: "students",
                    localField: "student_id",
                    foreignField: "_id",
                    as: 'student'
                }
            },
            {
                $unwind: {
                    path: "$student",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "courses",
                    localField: "student.courseId",
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
                $sort: {
                    createdAt: -1
                }
            },
            {
                $project: {
                    type: 1,
                    transaction_id: 1,
                    amount: 1,
                    paymentstatus: 1,
                    comment: 1,
                    student_name: "$student.student_name",
                    mobile: "$student.mobile",
                    studentId: "$student.studentId",
                    course_name: "$course.course_name",
                    createdAt: 1,
                }
            }

        ])
        return res.render("branch/Transictions", { data: user, transaction });
    } catch (error) {
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}