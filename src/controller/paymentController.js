import axios from "axios"
import crypto from "crypto"
import PaymentProcess from "../module/paymentProcessModel.js";
import userModel from "../module/userModel.js";
import PDFDocument from "pdfkit"

async function getUserDetails(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return await userModel.findById(decoded.id);
    } catch (error) {
        console.error("Error decoding token:", error.message);
        return null;
    }
}

export async function success(req, res) {
    if (req.query.id && req.query.paytoken) {
        req.flash("success", "Payment Success")
        const user = await userModel.findByIdAndUpdate(req.query.id, { isPaid: true });
        const payment = await PaymentProcess.findByIdAndUpdate(req.query.paytoken, { status: "success" });
        console.log("Payment Success", payment);
        res.redirect("uploadDoc");
    } else {
        res.redirect("home");
    }
}
export async function failure(req, res) {
    if (req.query.id && req.query.paytoken) {
        req.flash("error", "Payment Failed")
        const user = await userModel.findByIdAndUpdate(req.query.id, { isPaid: false });
        const payment = await PaymentProcess.findByIdAndUpdate(req.query.paytoken, { status: "failed" });
        console.log("Payment Failed", payment);
        res.redirect("/api/uploadDoc");
    } else {
        res.redirect("/api/home");
    }
}


export async function generatePaymentRecipt(req, res, next) {
  try {
      const user = await userModel.findById(req.user.id);
      const payment = await PaymentProcess.findOne({
          userid: req.user.id,
          status: "success",
      });

      if (!user || !payment) {
          req.flash('error', 'User or Payment details not found.');
          return res.redirect('back'); // Redirect to the previous page
      }

      const formattedDate = new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
      }).format(new Date(payment.createdAt));
      console.log("UserData-------->",user,"<---------UserData")
      const receiptDetails = {
          receiptNumber: payment.txnid.split("_")[1],
          post:user.post,
          aadhar:user.aadhar,
          customerName: user.name,
          category:user.category,
          courses:user.courses,
          district:user.district,
          dob:user.dob,
          gender:user.gender,
          idMark:user.idMark,
          nationality:user.nationality,
          police_station:user.police_station,
          email: user.email,
          mobile: user.mobile,
          address: `${user.village}, ${user.state} - ${user.pincode}`,
          fatherName: user.father_name,
          motherName: user.mother_name,
          amount: String(payment.amount),
          date: String(formattedDate),
          transactionId: String(payment.txnid),
          photoPath: `public/${user.image}`,
          signaturePath: `public/${user.signature}`,
          paymentStatus : payment.status
      };

      const doc = new PDFDocument({ margin: 50 });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
          "Content-Disposition",
          `attachment; filename=receipt_BECCE${receiptDetails.receiptNumber}.pdf`
      );

      doc.pipe(res);

      generateAttractiveReceipt(doc, receiptDetails);

      doc.end();
  } catch (error) {
      console.error("Error generating receipt:", error);

      // Flash error message and redirect
      req.flash('error', 'An error occurred while generating the receipt.');
      res.redirect('uploadDoc');
  }
}
  
function generateAttractiveReceipt(doc, details) {
  const marginX = 50;
  let cursorY = 50; // Start position for content
  const lineSpacing = 15; // Reduced line spacing

  // Header Section
  doc
    .image("public/image/LOGO.png", marginX, cursorY, { width: 50 })
    .fontSize(18) // Reduced font size
    .text("BIHAR EARLY CHILDHOOD CARE", marginX + 60, cursorY, { align: "left" })
    .fontSize(9)
    .text("Making a difference in education", marginX + 60, cursorY + 20, { align: "left" });

  doc
    .fontSize(10)
    .fillColor("#555")
    .text(`Date: ${details.date}`, 400, cursorY, { align: "right" })
    .text(`Receipt No: BECCE${details.receiptNumber}`, 400, cursorY + 15, { align: "right" });

  cursorY += 60; // Adjusted for the header height
  doc.moveTo(marginX, cursorY).lineTo(550, cursorY).stroke();
  cursorY += 10;

  // Personal Details Section
  doc.fontSize(12).fillColor("#000").text("Personal Details", marginX, cursorY, { underline: true });
  cursorY += lineSpacing;

  const personalDetails = [
    ["Name", details.customerName],
    ["Father's Name", details.fatherName],
    ["Mother's Name", details.motherName],
    ["Aadhar", details.aadhar],
    ["DOB", details.dob],
    ["Gender", details.gender],
    ["Nationality", details.nationality],
    ["Category", details.category],
    ["District", details.district],
    ["Police Station", details.police_station],
    ["Post", details.post],
    ["Address", details.address],
    ["Mobile", details.mobile],
    ["Email", details.email],
    ["ID Mark", details.idMark],
  ];

  personalDetails.forEach(([label, value]) => {
    doc
      .fontSize(10) // Reduced font size
      .text(`${label}:`, marginX, cursorY, { width: 100 })
      .text(value || "-", marginX + 110, cursorY);
    cursorY += lineSpacing;
  });

  // Adjust for photo
  if (details.photoPath) {
    doc.image(details.photoPath, 400, 130, { width: 80, height: 80 });
  }
  cursorY += 10;

  // Courses Section
  doc.fontSize(12).text("Course Details", marginX, cursorY, { underline: true });
  cursorY += lineSpacing;

  const coursesTable = [
    ["Course", "Year", "Total Marks", "Obtained Marks"],
    ["Matric", details.courses.matrix.year, details.courses.matrix.totalMarks, details.courses.matrix.obtainedMarks],
    ["Inter", details.courses.intern.year, details.courses.intern.totalMarks, details.courses.intern.obtainedMarks],
    ["NTT I Year", details.courses.other.year, details.courses.other.totalMarks, details.courses.other.obtainedMarks],
    ["NTT II Year", details.courses.NTT_II_year.year, details.courses.NTT_II_year.totalMarks, details.courses.NTT_II_year.obtainedMarks],
  ];

  const tableColWidths = [100, 80, 100, 100];
  const tableRowHeight = lineSpacing + 5;

  coursesTable.forEach((row, rowIndex) => {
    const rowTop = cursorY + rowIndex * tableRowHeight;

    // Draw horizontal lines
    doc.moveTo(marginX, rowTop).lineTo(550, rowTop).stroke();

    row.forEach((cell, colIndex) => {
      const cellLeft = marginX + tableColWidths.slice(0, colIndex).reduce((a, b) => a + b, 0);
      const cellWidth = tableColWidths[colIndex];

      // Draw vertical lines
      if (rowIndex === 0) {
        doc.moveTo(cellLeft, cursorY).lineTo(cellLeft, rowTop + tableRowHeight * coursesTable.length).stroke();
      }

      doc
        .fontSize(10)
        .text(cell, cellLeft + 5, rowTop + 2, { width: cellWidth - 10, align: "center" });
    });
  });

  // Final horizontal and vertical lines for the table
  doc.moveTo(marginX, cursorY + coursesTable.length * tableRowHeight).lineTo(550, cursorY + coursesTable.length * tableRowHeight).stroke();
  doc.moveTo(550, cursorY).lineTo(550, cursorY + coursesTable.length * tableRowHeight).stroke();
  cursorY += coursesTable.length * tableRowHeight + 10;

  // Payment Details Section
  doc.fontSize(12).text("Payment Details", marginX, cursorY, { underline: true });
  cursorY += lineSpacing;

  doc
    .fontSize(10)
    .text(`Transaction ID: ${details.transactionId}`, marginX, cursorY)
    .text(`Amount Paid: Rs ${details.amount}`, marginX, cursorY + lineSpacing)
    .text(`Status: ${details.paymentStatus}`, marginX, cursorY + 2 * lineSpacing);
  cursorY += 3 * lineSpacing;

  // Signature Section
  if (details.signaturePath) {
    try {
      doc.image(details.signaturePath, marginX, cursorY, { width: 80, height: 40 });
    } catch (error) {
      console.warn("Signature not found or invalid path.");
    }
    doc.fontSize(10).text("Authorized Signature", marginX, cursorY + 50);
  }
  cursorY += 60;

  // Footer Section
  doc
    .fontSize(9)
    .fillColor("#888")
    .text("Wish you best of luck.", marginX, doc.page.height - 90, { align: "center" });
}


