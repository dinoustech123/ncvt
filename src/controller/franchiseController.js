import franchiseModel from "../module/franchiseModel.js";
import jwt from "jsonwebtoken";
import userModel from "../module/userModel.js";
async function getUserDetails(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return await userModel.findById(decoded.id);
    } catch (error) {
        console.error("Error decoding token:", error.message);
        return null;
    }
}

export async function franchiseForm(req, res, next) {
    try {
        res.locals.message = req.flash(); 
        const user = req.cookies.authToken
            ? await getUserDetails(req.cookies.authToken)
            : null;
        return res.render("pages/franchise", { data: user, application: req.query.application });
    } catch (error) {
        console.error("Error in franchise Form:", error.message);
        return res.redirect("login");
    }
}

export async function submitFranchiseDetail(req, res, next) {
    try {
        let apply_for = "";
        if (req.query) {
            if (req.query.application == "vatika") {
                apply_for = "Bal Vatika Franchisee";
            }
            if (req.query.application == "ntt") {
                apply_for = "N.T.T Center Franchisee";
            }
        }
        if (req.body) {
            const franchise = new franchiseModel(req.body);
            franchise.apply_for = apply_for;
            await franchise.save();
            req.flash("success", "Franchisee details submitted successfully");
            return res.redirect("franchse-form");

            // return res.redirect("apply-for-franchisee");
        }
    } catch (error) {
        req.flash("error", "Franchisee form submission failed");
        console.error("Error in submitFranchiseDetail:", error.message);
        return res.redirect("apply-for-franchisee");
    }

}