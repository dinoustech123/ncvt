import express from 'express';
import dotenv from "dotenv"
import cookieParser from 'cookie-parser';
import dbConnect from "./src/db/dbConnect.js"
import api from "./src/routes/router.js"
import path from "path"
import flash from "connect-flash"
import session from 'express-session';
const app = express();
dotenv.config();
app.use(express.static(path.join(process.cwd(), '/public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "/src/views"));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
}))

dbConnect()
app.use(flash())
app.get("/", (req, res) => {
    res.redirect("/api")
})
app.use("/api", api)

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});