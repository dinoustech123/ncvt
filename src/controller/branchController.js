import jwt from "jsonwebtoken";
import branchModel from "../module/branchModel.js";

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