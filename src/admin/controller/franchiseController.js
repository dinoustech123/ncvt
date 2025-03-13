import franchiseModel from "../../module/franchiseModel.js";


export async function view_AllFranchiseRequests(req, res, next) {
    try {
        res.locals.message = req.flash();
        res.render("franchise/viewallrequests", {
            sessiondata: req.session.data,
            selectQuery: "",
            selectQuery3: "",
            selectQuery2: "",
            teamName: "",
            emailValue: "",
            mobileNo: "",
        });
    } catch (err) {
        req.flash("error", "..server error..");
        res.redirect("/");
    }
}


export async function view_request_datatable(req, res, next) {
    try {
        const conditions = {}; // Your conditions here
        const start = req.query.start; // Retrieve start from the request query
        const limit1 = req.query.limit1; // Retrieve limit1 from the request query
        const sortObject = {
            createdAt: -1
        }; // Define your sort object here

        // Count the total number of documents
        const totalFiltered = await franchiseModel.countDocuments(conditions).exec();

        // Find the users with pagination
        const rows1 = await franchiseModel
            .find(conditions)
            .skip(Number(limit1) ? Number(limit1) : "")
            .limit(Number(limit1) ? Number(limit1) : "")
            .sort(sortObject)
            .exec();

        let data = [];
        let count = 1;

        rows1.forEach((index) => {
            data.push({
                id: count,
                conter_name: index.conter_name,
                director_name: index.director_name,
                mobile: index.mobile || "",
                email: index.email || "",
                state: index.state || "",
                district: index.district || "",
                block: index.block || "",
                apply_for: index.apply_for || "",
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