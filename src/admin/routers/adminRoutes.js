import { Router } from "express";
import auth from "../../middleware/adminAuth.js"
import multer from "multer";
import {
    dashboard,
    adminLogin,
    adminLoginData,
    registerAdmin,
    registerAdminData,
    adminProfilePage,
    logout,
} from "../controller/adminController.js"
import {
    edit_admission,
    edit_admission_data,
    view_AllUsers,
    view_AllVerifiedUsers,
    view_users_datatable,
    view_Verifusers_datatable
} from "../controller/userController.js"
import { view_AllFranchiseRequests, view_request_datatable } from "../controller/franchiseController.js";
import { add_branch, add_branch_data, view_branch_datatable, view_all_branches , delete_branch, edit_branch, edit_branch_data } from "../controller/branchController.js";
import { add_caurses , add_caurses_data, view_all_Courses, view_Courses_datatable , delete_course } from "../controller/coursesController.js";
import { approve_deposit_request, approve_request_certificate, deposit_amount_datatable, depositAmount, download_certificate, reject_deposit_request, request_certificate, request_certificate_data } from "../controller/depositController.js";
const router = Router();


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `public/${req.body.typename}`);
    },
    filename: function (req, file, cb) {
        let exe = file.originalname.split(".").pop();
        let filename = `${Date.now()}.${exe}`;
        cb(null, filename);
    },
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype == "image/png" ||
            file.mimetype == "image/jpg" ||
            file.mimetype == "image/jpeg"
        ) {
            cb(null, true);
        } else {
            req.fileValidationError = "Only .png, .jpg and .jpeg format allowed!";
            return cb(null, false, req.fileValidationError);
            // cb(null,false);
            // return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
        }
    },
});

router.get("/", auth, dashboard);

router.post("/login", adminLogin)
router.get("/loginAdminData", adminLoginData)

router.get("/registerAdmin", registerAdmin)
router.post("/registerAdminData", registerAdminData)

router.get("/admin_profile_page", auth, adminProfilePage);
router.post("/logout", auth, logout);
// router.post("/admin_profile_data/:id", auth, adminPanelController.updateProfileData);

// users 
router.get('/view_all_admission', view_AllUsers);
router.post('/view_admission_datatable', view_users_datatable);
router.get("/edit_admission",  edit_admission);
router.post("/edit_admission_data",upload.single("image"),  edit_admission_data);

router.get('/view_all_verifiedUser', view_AllVerifiedUsers);
router.post('/view_Verifusers_datatable', view_Verifusers_datatable);

router.get("/view_all_franchise_requests", view_AllFranchiseRequests);
router.post("/request_datatable", view_request_datatable)

router.get("/add-branch", auth, add_branch);
router.post("/add_branch_data", auth, upload.single("images"), add_branch_data);
router.get('/view_all_branch', view_all_branches);
router.post('/view_branch_datatable', view_branch_datatable);
router.get('/delete-branch',  delete_branch);
router.get("/edit_branch", edit_branch);
router.post("/edit_branch_data",upload.single("images"), edit_branch_data);

router.get("/add_courses" ,  add_caurses)
router.post("/add_courses_data",  add_caurses_data);
router.get('/view_all_courses', view_all_Courses);
router.post('/view_courses_datatable', view_Courses_datatable);
router.get('/delete-course',  delete_course);


//---------deposit request----//
router.get("/deposit_amount",  depositAmount);
router.post("/deposit_amount_datatable",  deposit_amount_datatable);

router.get("/approve-deposit-request/:id", approve_deposit_request);
//approveend
router.get("/reject-deposit-request/:id", reject_deposit_request);

router.get("/request_certificate" , request_certificate);
router.post("/data-request_certificate" , request_certificate_data);
router.get("/approve_certificate_request/:id" , approve_request_certificate);
router.get("/download-certificate" , download_certificate);
export default router