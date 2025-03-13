import express from "express";
import session from "express-session";
import connectDB from "./src/db/dbConnect.js"
import cookieParser from "cookie-parser";
import dotenv from "dotenv"
import adminRouter from "./src/admin/routers/adminRoutes.js"
import flash from "connect-flash"
import path from "path"
dotenv.config();
const app = express();
app.use(cookieParser())
app.use(express.static(path.join(process.cwd(), "/public")))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
connectDB()
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "/src/admin/views"));
app.use(session({
    secret: process.env.ADMIN_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 6 * 60 * 60 * 1000, httpOnly: true }
}));
app.use(flash());

app.use("/", adminRouter)

app.listen(process.env.Admin_PORT, () => {
    console.log(`Server is running on port ${process.env.Admin_PORT}`);
});