import studentModel from "../module/studentModel.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import moment from "moment";
import admissionModel from "../module/admissionModel.js";

function generateToken(payload) {
    console.log("Generating token", payload);
    try {
        const authToken = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "1D",
        });
        const refreshToken = jwt.sign({ id: payload._id }, process.env.JWT_SECRET, {
            expiresIn: "1M",
        });
        console.log("Generated tokens", authToken, refreshToken);
        return { authToken: authToken, refreshToken: refreshToken, status: "ok" };
    } catch (error) {
        return { authToken: "", refreshToken: "", error: error };
    }
}

async function getUserFromToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return await studentModel.findById(decoded.id, {
            studentId: 1,
            student_name: 1,
            admissionId: 1
        });
    } catch (error) {
        console.error("Error decoding token:", error.message);
        return null;
    }
}


export async function studentportal(req, res) {
    try {
        res.locals.message = req.flash();
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        return res.render("student/student-portal", { data: user });
    } catch (error) {
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}

export async function studentlogin(req, res) {
    try {
        res.locals.message = req.flash();
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        return res.render("student/student-login", { data: user });
    } catch (error) {
        req.flash("error", "login error");
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}




export async function loginStudentData(req, res, next) {
    try {
        let { studentId, mobile } = req.body;
        studentId = studentId.toUpperCase();
        if (!studentId && !mobile) {
            req.flash("error", "User Not Found");
            return res.redirect("student-login");
        }
        const user = await studentModel.findOne({ studentId });
        if (!user) {
            req.flash("error", "User Not Found");
            return res.redirect("student-login");
        }
        let checkPass = user.mobile == mobile ? true : false;
        if (!checkPass) {
            req.flash("error", "Invalid username or password");
            return res.redirect("student-login");
        }
        // console.log(checkPass);
        if (checkPass) {
            let payload = {
                id: user._id,
                admissionId: user.admissionId,
                courseId: user.courseId,
                branchId: user.branchId,
                studentId: user.studentId,
                student_name: user.student_name,
            };
            const token = generateToken(payload);
            //   console.log(token);
            const options = {
                httpOnly: true,
                secure: true,
            };
            if (token.status === "ok") {
                return res
                    .status(200)
                    .cookie("authToken", token.authToken, options)
                    .cookie("refreshToken", token.refreshToken, options)
                    .redirect("student-portal");
            }
        }
    } catch (error) {
        console.log(error);
        next();
    }
}


export async function studentLogout(req, res, next) {
    try {
        const user = await studentModel.findById(req.user.id);
        if (!user) {
            req.flash("error", "User Not Found");
            return res.redirect("student-login");
        }
        const options = {

            httpOnly: true,
            secure: true,
            sameSite: "strict",
        };
        if (req.cookies) {
            res.clearCookie("authToken", options);
            res.clearCookie("refreshToken", options);
        }
        // return res.status(200).json({ status: true, message: "Successfully logged out" });
        return res.redirect("home");
    } catch (error) {
        req.flash("error", "Internal Server Error");
        return res.redirect("student-login");
    }
}

export async function studentidcard(req, res) {
    try {
        res.locals.message = req.flash();
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        const admission = await admissionModel.findOne({ _id: user.admissionId });
        return res.render("student/student-id-card", { data: user, admission });
    } catch (error) {
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}



export async function generateStudentReceipt(req, res, next) {
    try {
        if (!req.user.id) {
            req.flash("error", "User Not Found!");
            return res.redirect("student-login");
        }
        let user = await studentModel.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.user.id)
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
        res.setHeader('Content-Disposition', `attachment; filename="${user.studentId}/registration_receipt.pdf"`);
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.log(error)
        req.flash("error", "Internal Server Error");
        return res.redirect("student-login");
    }
}


export async function generateIDCard(req, res) {
    try {
        if (!req.user) {
            req.flash("error", "User Not Found!");
            return res.redirect("student-login");
        }
        const admission = await admissionModel.findById(req.user.admissionId)
        console.log(admission)
        if (!admission) {
            req.flash("error", "Admission Not Found!");
            return res.redirect("student-login");
        }

        const pdfDoc = await PDFDocument.create();

        const frontPage = pdfDoc.addPage([500, 300]); // ID card size
        const { width, height } = frontPage.getSize();

        // Load fonts
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Header Section (Dark Blue)
        frontPage.drawRectangle({
            x: 0,
            y: height - 50,
            width: width,
            height: 50,
            color: rgb(0, 0.2, 0.6),
        });

        // Load and embed logo
        const logoPath = path.join(process.cwd(), "public", "image", "id-header.png");
        if (fs.existsSync(logoPath)) {
            const logoBytes = fs.readFileSync(logoPath);
            const logoImage = await pdfDoc.embedPng(logoBytes);
            frontPage.drawImage(logoImage, {
                x: 10,
                y: height - 101,
                width: 480,
                height: 90,
            });
        }
        const footerPath = path.join(process.cwd(), "public", "image", "id-footer.png");
        if (fs.existsSync(footerPath)) {
            const logoBytes = fs.readFileSync(footerPath);
            const logoImage = await pdfDoc.embedPng(logoBytes);
            frontPage.drawImage(logoImage, {
                x: 10,
                y: 10,
                width: 480,
                height: 22,
            });
        }

        // Student Image
        const studentImagePath = path.join(process.cwd(), "public", admission?.image); // Change this path
        if (fs.existsSync(studentImagePath)) {
            const studentImageBytes = fs.readFileSync(studentImagePath);
            let studentImage;
            studentImagePath.split(".").pop() == "png" ? studentImage = await pdfDoc.embedPng(studentImageBytes) :
                studentImage = await pdfDoc.embedJpg(studentImageBytes);
            frontPage.drawImage(studentImage, {
                x: 370,
                y: height - 205,
                width: 100,
                height: 100,
            });
        }
        const signPath = path.join(process.cwd(), "public", "image", "sign.png"); // Change this path
        if (fs.existsSync(signPath)) {
            const studentImageBytes = fs.readFileSync(signPath);
            let studentImage = await pdfDoc.embedPng(studentImageBytes)
            frontPage.drawImage(studentImage, {
                x: 370,
                y: height - 280,
                width: 100,
                height: 100,
            });
        }

        // Border Design
        frontPage.drawRectangle({
            x: 10,
            y: 10,
            width: width - 20,
            height: height - 20,
            borderColor: rgb(0, 0, 0),
            borderWidth: 2,
        });

        // Student Information
        const textData = [
            { label: "Regd. No.:", value: admission?.admission_number || "N/A", x: 20, y: 180 },
            { label: "Name:", value: String(admission?.student_name).toUpperCase() || "N/A", x: 20, y: 160 },
            { label: "Course:", value: String(admission?.course_name).toUpperCase() || "N/A", x: 20, y: 140 },
            { label: "Date of Issue:", value: admission?.admission_date || "N/A", x: 20, y: 120 },
            { label: "Mobile No.:", value: String(admission?.mobile) || "N/A", x: 20, y: 100 },
            { label: "Auth. Center:", value: String(admission?.branch_name).toUpperCase() || "N/A", x: 20, y: 80 },
        ];

        textData.forEach(({ label, value, x, y }) => {
            frontPage.drawText(label, { x, y, size: 11, font: fontBold, color: rgb(0, 0, 0) });
            frontPage.drawText(value, { x: x + 120, y, size: 11, font: fontRegular, color: rgb(0, 0, 0) });
        });

        // Signature text
        frontPage.drawText("Auth. Signature", { x: 370, y: 50, size: 10, font: fontBold, color: rgb(0, 0, 0) });

        /*** 🟢 Page 2: Instructions ***/
        const backPage = pdfDoc.addPage([500, 300]);
        const { width: width2, height: height2 } = backPage.getSize();

        // Header Section
        backPage.drawRectangle({
            x: 0,
            y: height2 - 40,
            width: width2,
            height: 40,
            color: rgb(0, 0.2, 0.6) // Blue Background
        });

        backPage.drawText("INSTRUCTIONS", {
            x: width2 / 2 - 60,
            y: height2 - 30,
            size: 14,
            color: rgb(1, 1, 1), // White Text
            font: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        });

        // Instruction Text
        const instructions = [
            "1. For Security And Identification Purpose This Card Must Be Carried At All",
            "    Times By The Student.",
            "2. No Student Will Be Allowed Inside The Classroom & Lab Room Without",
            "    Identity Card.",
            "3. Duplicate Identity Card Will be Issued By Paying Rs. 25/- At Your",
            "    Study Centre.",
            "4. Students Are Requested To Produce The I Card At The Time Of Issuing ",
            "    Course Materials Installment Payment & In The Exam Hall.",
        ];

        let yPosition = height2 - 70;
        const instructionFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        instructions.forEach((text) => {
            backPage.drawText(text, {
                x: 20,
                y: yPosition,
                size: 12,
                font: instructionFont,
                color: rgb(0, 0, 0),
            });
            yPosition -= 20;
        });

        // Blue Validity Text
        backPage.drawText(
            "# The Validity of this card is for a period equivalent to the duration of course from the date of issue.",
            {
                x: 20,
                y: 60,
                size: 10,
                color: rgb(0, 0, 1), // Blue Color
            }
        );

        // Footer Text
        backPage.drawText("This is Computer Generated ID. Card. From www.ncvtindia.com", {
            x: 20,
            y: 30,
            size: 10,
            font: await pdfDoc.embedFont(StandardFonts.HelveticaOblique), // Italic
            color: rgb(0, 0, 0),
        });

        /*** 🟢 Save & Send the PDF ***/
        const pdfBytes = await pdfDoc.save();
        const pdfBuffer = Buffer.from(pdfBytes);

        res.setHeader("Content-Disposition", 'attachment; filename="NCVT_ID_Card.pdf"');
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", pdfBuffer.length);
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).send("Error generating ID card");
    }
}

export async function viewregistration(req, res) {
    try {
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        const admission = await admissionModel.findOne({ _id: user.admissionId });
        return res.render("student/view-registration", { data: user, admission });
    } catch (error) {
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}
