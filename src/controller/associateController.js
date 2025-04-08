import userModel from "../module/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"
import branchModel from "../module/branchModel.js";
import mongoose from "mongoose";
import transactionModel from "../module/transactionModel.js";


async function getUserFromToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return await userModel.findById(decoded.id);
    } catch (error) {
        console.error("Error decoding token:", error.message);
        return null;
    }
}
async function getUserDetails(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return await userModel.findById(decoded.id);
    } catch (error) {
        console.error("Error decoding token:", error.message);
        return null;
    }
}

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

// Improved route handlers
export async function loginAssociate(req, res) {
    try {
        res.locals.message = req.flash();
        const user = req.cookies.authToken
            ? await getUserFromToken(req.cookies.authToken)
            : null;
        return res.render("associateMember/login", { data: user });
    } catch (error) {
        req.flash("error", "login error");
        console.error("Error in loginPage:", error.message);
        return res.redirect("signup");
    }
}


export async function loginAssociateMember(req, res, next) {
    try {
        console.log(req.body)
        const { mobile, password } = req.body;
        if (!mobile || !password) {
            req.flash("error", "All fields are required");
            return res.redirect("associate-login");
        }

        const user = await userModel.findOne({ mobile });
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("associate-login");
        }
        let check = await user.comparePassword(password)
        if (!check) {
            req.flash("error", "Incorrect password");
            return res.redirect("associate-login");
        }
        // Generate JWT token
        let payload = {
            id: user._id,
            name: user.name,
            mobile: user.mobile,
            email: user.email,
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
                .redirect("associate-dashboard");
        }

        req.flash("error", "Login failed");
        return res.redirect("associate-login");

    } catch (error) {
        req.flash("error", "Invalid request");
        console.error("Invalid request in loginAssociateMember:", error.message);
        return res.redirect("associate-login");
    }
}


export async function loginAssociateDashboard(req, res) {
    try {
        res.locals.message = req.flash();
        const user = req.cookies.authToken
            ? await getUserFromToken(req.cookies.authToken)
            : null;
        return res.render("associateMember/dashboard", { data: user });
    } catch (error) {
        req.flash("error", "login error");
        console.error("Error in loginPage:", error.message);
        return res.redirect("signup");
    }
}
export async function addBranch(req, res) {
    try {
        res.locals.message = req.flash();
        const user = req.cookies.authToken
            ? await getUserFromToken(req.cookies.authToken)
            : null;
        return res.render("associateMember/addBranch", { data: user });
    } catch (error) {
        req.flash("error", "login error");
        console.error("Error in loginPage:", error.message);
        return res.redirect("signup");
    }
}



export async function addBranchData(req, res, next) {
    try {
        res.locals.message = req.flash();
        if (req.file) {
            console.log(req.file);
            req.body.images = `branch/${req.file.filename}`;
        }

        if (!req.body.password) {
            req.flash("error", "Password is required");
            return res.redirect("/add-branch");
        };
        req.body.branch_code = req.body.branch_code.toLowerCase()
        const salt = await bcrypt.genSalt(Number(process.env.SALT_ROUND));
        req.body.password = await bcrypt.hash(String(req.body.password), salt);

        if (req.body) {
            req.body.referedBy = new mongoose.Types.ObjectId(req.user.id)
            let branch = await branchModel.create(req.body)
            console.log("branch", branch);
            if (branch) {
                req.flash("success", "Branch Added Successfully");
                return res.redirect("add-branch");
            }
        }
        req.flash("error", "data Not Found");
        return res.redirect("/");
    } catch (error) {
        console.error(error);
        req.flash("error", "..server error..");
        res.redirect("/");

    }


}



export async function viewAllBranches(req, res, next) {
    try {
        const user = req.cookies.authToken
            ? await getUserFromToken(req.cookies.authToken)
            : null;
        let branches = await branchModel.find({ referedBy: new mongoose.Types.ObjectId(req.user.id) })
        console.log(branches);
        return res.render("associateMember/viewAllBranches", { data: user, branches })
    } catch (error) {
        console.error(error);
        req.flash("error", "..server error..");
        res.redirect("/");
    }
}


export async function viewAssociateTransications(req, res, next) {
    try {
        const user = req.cookies.authToken
            ? await getUserFromToken(req.cookies.authToken)
            : null;
        console.log(req.user.id);
        const tran = await transactionModel.find({
            userid: req.user.id
        });
        return res.render("associateMember/Transictions", { data :user  ,tran })
    } catch (error) {
        console.error(error);
        req.flash("error", "..server error..");
        res.redirect("/");
    }
}