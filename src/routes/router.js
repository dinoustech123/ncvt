import { Router } from "express";
import upload from "../utils/multer.js"
import branchAuth from "../middleware/branchAuth.js";
import studentAuth from "../middleware/studentAuth.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  completeProfile,
  // uploadDocumentsAndPayment,
  loginPage,
  indexPage,
  registerPage,
  profileUpdate,
  uploadDoc,
  registerOtp,
  forgotPassword,
  forgotPasswordPage,
  uploadDocuments,
  makePayment,
  verifyForgotOtp,
  updateForgotPass,
} from "../controller/userController.js";
import {
  pagetitle,
  aboutus,
  contactus,
  privacypolicy,
  termscondition,
  returnpolicy,
  applyforfranchisee,
  righttoeducation,
  copyrightpolicy,
  fnq,
  career,
  news1,
  news2,
} from "../controller/pageController.js"
import { submitFranchiseDetail, franchiseForm } from "../controller/franchiseController.js"
import { success, failure, generatePaymentRecipt } from "../controller/paymentController.js";
import { addStudentMark, admission, admissionData, generateStudentCertificate, generateStudentMarkSheet, passStudent, payExamFee, requestCertificates, secondYearCertificate,  StudentReceipt, studentRequests, viewAdmissions, viewRequestCertificates } from "../controller/admissionController.js"
import { depositRequest, getDeposit } from "../controller/depositController.js"
import { studentportal, studentlogin, loginStudentData, studentLogout, generateStudentReceipt, studentidcard, generateIDCard, viewregistration } from "../controller/studentController.js"

import auth from "../middleware/auth.js";
import { addpayments, branch_dashboard, viewTransictions } from "../controller/branchController.js";
import { addBranch, addBranchData, loginAssociate, loginAssociateDashboard, loginAssociateMember, viewAllBranches, viewAssociateTransications } from "../controller/associateController.js";
const router = Router();
const documents = upload.fields([
  { name: "matric", maxCount: 1 },
  { name: "inter", maxCount: 1 },
  { name: "NTT_certificate", maxCount: 5 },
  { name: "image", maxCount: 1 },
  { name: "sign", maxCount: 1 }
])


// Define a middleware function to check for authentication
router.get("/", (req, res) => {
  res.redirect("/api/home")
})

// Home Page Routers
router.get('/home', indexPage);
router.get('/page-title', pagetitle);
router.get('/about-us', aboutus);
router.get('/contact-us', contactus);
router.get('/privacy-policy', privacypolicy);
router.get('/terms-condition', termscondition);
router.get('/return-policy', returnpolicy);
router.get('/apply-for-franchisee', applyforfranchisee);
router.get('/righttoeducation', righttoeducation);
router.get('/copyrightpolicy', copyrightpolicy);
router.get('/fnq', fnq);
router.get('/career', career);
router.get("/news1", news1);
router.get("/news2", news2);


// Login Routers 
router.get("/login", loginPage)
router.post("/login", loginUser)
router.get("/logoutUser", branchAuth, logoutUser)


// Forgot Password Routers 
router.get("/forgot-Password", forgotPasswordPage)
router.post("/forgotPassword", forgotPassword)
router.post("/forgotPasswordOtp", verifyForgotOtp)
router.post("/updateForgotPass", updateForgotPass)


// Register Routers
router.get('/signup', registerPage);
router.post("/register", registerUser)
router.post("/verify-otp/:id", registerOtp)

// Profile Routers
router.get("/updatedetails", auth, profileUpdate)
router.get("/uploadDoc", auth, uploadDoc)
router.post("/completeProfileDetails", auth, completeProfile)

// Upload Documents and Payment Routers
router.post("/uploadDocuments", auth, documents, uploadDocuments);
router.get("/payment", auth, makePayment);

// Success and Failure Endpoints
router.post('/success', success);
router.post('/failure', failure)
router.get("/generate-receipt", auth, generatePaymentRecipt);


// Franchise Routes
router.get('/franchse-form', franchiseForm)
router.post('/submit-franchise-detail', submitFranchiseDetail)

// Admission Routes
router.get('/admission', branchAuth, admission);
router.post('/admission', branchAuth, upload.single("admission"), admissionData);
router.get("/view-admission", branchAuth, viewAdmissions)
router.post("/add-student-marks", branchAuth, addStudentMark)
router.post("/pay-exam-fee", branchAuth, payExamFee)
router.get("/request_certificates", branchAuth, requestCertificates)
router.get("/view-request_certificates", branchAuth, viewRequestCertificates)
router.get("/passed_student", branchAuth, passStudent)
router.get("/student_registration_recipt/:id", branchAuth, StudentReceipt)
router.get("/student_request", branchAuth, studentRequests)
router.post("/generate_student_certificate", branchAuth, generateStudentCertificate)
router.post("/generate_student_marksheet", generateStudentMarkSheet)
// router.get('/2nd-year-marksheet', secondYearCertificate);
router.post("/depostRequest", branchAuth, depositRequest)
router.get("/getdeposit", branchAuth, getDeposit)
router.get("/view-transictions", branchAuth, viewTransictions)

//branch Dashboard
router.get("/branch_dashboard", branchAuth, branch_dashboard);
router.get("/add-payments", branchAuth, addpayments);


// Student Portal
router.get("/student-login", studentlogin)
router.post("/student-login-data", loginStudentData)
router.get("/student-portal", studentAuth, studentportal);
router.get("/studentLogut", studentAuth, studentLogout)
router.get("/student-id-card", studentAuth, studentidcard);
router.get("/student-id-card-print", studentAuth, generateIDCard)
router.get("/student-recipt", studentAuth, generateStudentReceipt)
router.get("/view-registration", studentAuth, viewregistration);


router.get("/associate-login", loginAssociate)
router.post("/associate-login-data", loginAssociateMember)
router.get("/associate-dashboard", loginAssociateDashboard)
router.get("/add-branch", auth, addBranch)
router.post("/add-branch-data", auth, upload.single("branch"), addBranchData)
router.get("/view-all-branches", auth, viewAllBranches)
router.get("/view-associate-transications", auth, viewAssociateTransications)



export default router
