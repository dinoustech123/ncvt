import userModel from "../module/userModel.js"
import jwt from "jsonwebtoken"
async function getUserFromToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return await branchModel.findById(decoded.id, { name: 1 });
    } catch (error) {
        console.error("Error decoding token:", error.message);
        return null;
    }
}
export async function pagetitle(req, res) {
    try {
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        return res.render("pages/page-title", { data: user });
    } catch (error) {
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}
export async function aboutus(req, res) {
    try {
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        return res.render("pages/about-us", { data: user });
    } catch (error) {
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}
export async function contactus(req, res) {
    try {
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        return res.render("pages/contact-us", { data: user });
    } catch (error) {
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}
export async function privacypolicy(req, res) {
    try {
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        return res.render("pages/privacy-policy", { data: user });
    } catch (error) {
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}
export async function termscondition(req, res) {
    try {
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        return res.render("pages/terms-condition", { data: user });
    } catch (error) {
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}
export async function returnpolicy(req, res) {
    try {
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        return res.render("pages/return-policy", { data: user });
    } catch (error) {
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}

export async function applyforfranchisee(req, res) {
    try {
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        return res.render("pages/apply-for-franchisee", { data: user });
    } catch (error) {
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}

export async function righttoeducation(req, res) {
    try {
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        return res.render("pages/right-to-education", { data: user });
    } catch (error) {
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}
export async function copyrightpolicy(req, res) {
    try {
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        return res.render("pages/copyright-policy", { data: user });
    } catch (error) {
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}
export async function fnq(req, res) {
    try {
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        return res.render("pages/fnq", { data: user });
    } catch (error) {
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}
export async function career(req, res) {
    try {
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        return res.render("pages/career", { data: user });
    } catch (error) {
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}
export async function news1(req, res) {
    try {
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        return res.render("pages/news1", { data: user });
    } catch (error) {
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}
export async function news2(req, res) {
    try {
        const user = req.cookies.authToken ? await getUserFromToken(req.cookies.authToken) : null;
        return res.render("pages/news2", { data: user });
    } catch (error) {
        console.error("Error in indexPage:", error.message);
        return res.redirect("signup");
    }
}
