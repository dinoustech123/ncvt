import jwt from "jsonwebtoken";
import studentModel from "../module/studentModel.js";

async function auth(req, res, next) {
    try {
        if (req.cookies.authToken || req.header('Authorization')) {
            const token = req.cookies.authToken ||
                req.header('Authorization').replace("Bearer ", "");
            if (!token) {
                return res.redirect("student-login");
            }
            const decode = jwt.verify(token, process.env.JWT_SECRET)
            if (!decode) return res.redirect("student-login");
            console.log(decode)
            if (decode) {
                let user = await studentModel.findOne({ _id: decode.id })

                if (!user) return res.redirect("student-login");
            }
            req.user = decode;
            next()
        }else{
            return res.redirect("student-login");
        }
    } catch (error) {
        console.error(error);
        // res.status(500).json({ status: false, message: "internal error" });
        res.redirect("home")
    }
}


export default auth;