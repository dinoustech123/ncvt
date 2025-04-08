import userModel from "../../module/userModel.js";
import bcrypt from "bcrypt"

export async function add_refer_member(req, res, next) {
    try {
        res.locals.message = req.flash();
        res.render("refer/addReferMember", {
            sessiondata: req.session.data,
            selectQuery: "",
            selectQuery3: "",
            selectQuery2: "",
            teamName: "",
        });
    } catch (error) {
        console.error(error);
        req.flash("error", "..server error..");
        res.redirect("/");

    }

}


export async function add_refer_member_data(req, res, next) {
    try {
        if (req.body) {
            console.log(req.file)
            req.body.image = `${req.body.typename}/${req.file.filename}`
            req.body.cleanpass = req.body.password
            const salt = await bcrypt.genSalt(Number(process.env.SALT_ROUND));
            req.body.password = await bcrypt.hash(String(req.body.password), salt);
            let referMember = await userModel.create(req.body);
            if (referMember) {
                req.flash("success", "Refer Member Added Successfully");
                return res.redirect("/add_refer_member");
            }
        }
        req.flash("error", "All Fields Are Required");
        return res.redirect("/add_refer_member");
    } catch (error) {
        console.error(error);
        req.flash("error", "..server error..");
        res.redirect("/");

    }
}


export async function view_all_referMember(req, res, next) {
    try {
        res.locals.message = req.flash();
        const { status, mobile } = req.query;
        return res.render("refer/viewAllReferMember", {
            sessiondata: req.session.data,
            selectQuery: status,
            selectQuery3: status,
            selectQuery2: status,
            mobileNo: mobile,
        });
    } catch (error) {
        console.error(error);
        req.flash("error", "..server error..");
        res.redirect("/");
    }
}



export async function view_all_refer_dataTable(req, res, next) {
    try {
        const conditions = { role: "associate" }; // Your conditions here
        const start = req.query.start; // Retrieve start from the request query
        const limit1 = req.query.limit1; // Retrieve limit1 from the request query
        const sortObject = {
            createdAt: -1
        }; // Define your sort object here

        // Count the total number of documents
        const totalFiltered = await userModel.countDocuments(conditions).exec();

        // Find the users with pagination
        const rows1 = await userModel
            .find(conditions)
            .skip(Number(limit1) ? Number(limit1) : "")
            .limit(Number(limit1) ? Number(limit1) : "")
            .sort(sortObject)
            .exec();

        let data = [];
        let count = 1;
        console.log(rows1)
        rows1.forEach((index) => {
            data.push({
                id: count,
                name: index.name,
                mobile: index.mobile,
                email: index.email || "",
                role: index.role || "",
                percentage: index.percentage || 0,
                withdrawal_balance: index.userbalance?.withdrawal_balance,
            });
            count++;
        });

        let json_data = JSON.stringify({
            recordsTotal: totalFiltered,
            recordsFiltered: totalFiltered,
            data: data,
        });
        res.send(json_data);
    } catch (error) {
        console.log(error);
    }
}