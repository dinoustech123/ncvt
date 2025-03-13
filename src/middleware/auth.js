import jwt from "jsonwebtoken";
import userModel from "../module/userModel.js"

async function auth(req, res, next) {
    try {
        if (req.cookies.authToken || req.header('Authorization')) {
            const token = req.cookies.authToken ||
                req.header('Authorization').replace("Bearer ", "");
            if (!token) {
                return res.status(401).json({ status: false, message: 'Invalid Token' });
            }
            const decode = jwt.verify(token, process.env.JWT_SECRET)
            if (!decode) return res.status(401).json({ status: false, message: 'Token Expired' });
            if (decode) {
                let user = await userModel.findOne({ _id: decode.id })
                if (!user) return res.status(401).json({ status: false, message: 'User not found' });
            }
            req.user = decode;
            next()
        }
    } catch (error) {
        console.error(error);
        // res.status(500).json({ status: false, message: "internal error" });
        res.redirect("home")
    }
}


export default auth;