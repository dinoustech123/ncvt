import userModel from "../../module/userModel.js";
import adminModel from "../../module/adminModel.js"


export async function dashboard(req, res, next) {
    try {
        const user = await userModel.countDocuments({})
        const documentCount = await userModel.countDocuments({
            documents: { $exists: true }
        });

        return res.render("dashboard", {
            sessiondata: req.session.data,
            dashData: {
                user,
                documentCount
            }
        })
    } catch (error) {
        next(error)
    }

}


export async function adminLogin(req, res, next) {
    try {
        const admin = await adminModel.findOne({ email: req.body.email, role: "0" }).exec();
        if (!admin) {
            req.flash('error', { message: 'Please  select a user' })
            return res.render("admin/adminLogin", {
                message: {
                    error: "User not found"
                }
            });
        }
        if (admin.password !== req.body.password) {
            req.flash("error", "passwords do not match");
            return res.render("admin/adminLogin", {
                message: {
                    error: "User passwor is not correct"
                }
            });
        }
        req.session.regenerate(() => {
            req.session.admin = true;
            req.session.data = admin
            return res.redirect("/");
        });
    } catch (error) {
        next(error)
        throw error;
    }

}


export async function adminLoginData(req, res, next) {
    try {
        res.locals.message = req.flash();
        return res.render("admin/adminLogin")
    } catch (error) {
        next(error)
    }
}




export async function registerAdmin(req, res, next) {
    try {
        return res.render("admin/registerAdmin")
    } catch (error) {
        next(error)
        throw error;
    }
}


export async function registerAdminData(req, res, next) {
    try {
        const check = await adminModel.findOne({ emial: req.body.email })
        if (check) {
            req.flash('error', { message: 'Email already exists' })
            return res.render("admin/registerAdmin", {
                message: {
                    error: "Email already exists"
                }
            });
        }
        if (req.body) {
            const admin = new adminModel({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password,
                role: "0"
            });
            await admin.save();
            return res.redirect("loginAdminData");
        }
        return res.render("admin/registerAdmin")
    } catch (error) {
        next(error)
        throw error;
    }
}


export async function adminProfilePage(req, res, next) {
    try {
        const adminData = await adminModel.findOne({
            role: req.session.data.role,
        });
        req.session.data = adminData;
        res.locals.message = req.flash();
        res.render("admin/adminProfile", {
            sessiondata: req.session.data,
        });
    } catch (error) {
        console.log(error);
    }
}


export async function logout(req, res, next) {
    try {
        res.locals.message = req.flash();
        req.session.destroy();
        res.clearCookie("url");
        res.redirect("/");
    } catch (error) {
        next(error);
    }
}