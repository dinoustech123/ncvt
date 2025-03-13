import userModel from "../../module/userModel.js";
import branchModel from "../../module/branchModel.js"
import fs from "fs";
import path from "path"
import bcrypt from "bcrypt";


export async function add_branch(req, res, next) {
    try {
        res.locals.message = req.flash();
        res.render("Branch/addBranch", {
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



export async function add_branch_data(req, res, next) {
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
            console.log(req.body)
            let branch = await branchModel.create(req.body)
            console.log("branch", branch);
            if (branch) {
                req.flash("success", "Branch Added Successfully");
                return res.redirect("/add-branch");
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


export async function view_all_branches(req, res) {
    try {
        res.locals.message = req.flash();
        const { status, mobile } = req.query;
        return res.render("Branch/viewAllBranch", {
            sessiondata: req.session.data,
            sessiondata: req.session.data,
            selectQuery: status,
            selectQuery3: status,
            selectQuery2: status,
            mobileNo: mobile,
        });
    } catch (err) {
        req.flash("error", "..server error..");
        res.redirect("/");
    }
}


export async function view_branch_datatable(req, res) {
    try {
        const conditions = {}; // Your conditions here
        const start = req.query.start; // Retrieve start from the request query
        const limit1 = req.query.limit1; // Retrieve limit1 from the request query
        const sortObject = {}; // Define your sort object here
        const totalFiltered = await branchModel.countDocuments(conditions).exec();
        const rows1 = await branchModel
            .find(conditions)
            .skip(Number(limit1) ? Number(limit1) : "")
            .limit(Number(limit1) ? Number(limit1) : "")
            .sort(sortObject)
            .exec();
        let data = [];
        let count = 1;
        rows1.forEach((index) => {
            // console.log(index, "User Data");
            data.push({
                id: count,
                branchName: index.branch_name,
                branchCode: index.branch_code.toUpperCase(),
                directorName: index.directore_name,
                location: index.location,
                city: index.city,
                dist: index.dist,
                state: index.state,
                pincode: index.pincode,
                directoreMob: index.directore_mob,
                images: `<img src="${process.env.BASE_URL}/${index.images}" alt="Branch Image" style="width: 100px; height: 100px;">`,
                // youtuberStatus: index.youtuberStatus ? "Active" : "Inactive",


                action: `<a class="btn btn-sm text-uppercase mr-2 btn-primary w-35px h-35px" title="Edit" href="/edit_branch?Id=${index._id}"> <i class="fas fa-pencil" aria-hidden="true"></i></a>
                <a  onclick="delete_sweet_alert('/delete-branch?branchId=${index._id}', 'Are you sure you want to delete this data?')" class="btn btn-sm btn-danger w-35px h-35px text-uppercase"><i class='fas fa-trash-alt'></i></a></div>`,
            });
            count++;
        });
        let json_data = JSON.stringify({
            recordsTotal: totalFiltered,
            recordsFiltered: totalFiltered,
            data: data,
        });
        res.send(json_data);
    }
    catch (error) {
        console.log(error);
    }
    // const branches = await branchModel.find();
    // res.render("Branch/viewAllBranch", {
    //     branches: branches
    // });
    // console.log(branches);
}


export async function delete_branch(req, res, next) {
    try {
        if (!req.query.branchId) {
            req.flash("error", "..Branch Id Not Found..");
            res.redirect("/");
        }
        const branch = await branchModel.findById(req.query.branchId);
        const fullPath = path.join(process.cwd(), "public\\", branch.images)
        fs.unlink(fullPath, (err) => {
            if (err) {
                console.error("Error deleting file:", err);
            } else {
                console.log("File deleted:", fullPath);
            }
        });
        await branch.deleteOne()
        if (!branch) {
            req.flash("error", "..server error..");
            return res.redirect("/");
        }
        req.flash("success", "Branch Deleted Successfully");
        return res.redirect("/view_all_branch");
    } catch (error) {
        console.error(error);
        req.flash("error", "..server error..");
        return res.redirect("/");
    }
}


export async function edit_branch(req, res, next) {
    try {
        const branch = await branchModel.findById(req.query.Id)
        res.locals.message = req.flash();
        res.render("Branch/editBranch", {
            sessiondata: req.session.data,
            selectQuery: "",
            selectQuery3: "",
            selectQuery2: "",
            teamName: "",
            emailValue: "",
            mobileNo: "",
            data: branch
        });
    } catch (err) {
        req.flash("error", "..server error..");
        res.redirect("/");
    }
}



export async function edit_branch_data(req, res, next) {
    try {
        res.locals.message = req.flash();
        let branch = await branchModel.findById(req.query.id);
        if (!branch) {
            req.flash("error", "..Branch Id Not Found..");
            return res.redirect("/");
        }
        if (req.file) {
            req.body.images = `branch/${req.file.filename}`;
        }
        req.body.branch_code = req.body.branch_code.toLowerCase()
        if (req.body.password) {
            const salt = await bcrypt.genSalt(Number(process.env.SALT_ROUND));
            req.body.password = await bcrypt.hash(String(req.body.password), salt);
        }

        if (req.body) {
            const filteredData = Object.fromEntries(
                Object.entries(req.body).filter(([_, value]) => value !== null && value !== "")
            );

            // Ensure filteredData is not empty after removing null/empty values
            if (Object.keys(filteredData).length === 0) {
                req.flash("error", "All fields are empty, nothing to save");
                return res.redirect("/add-branch");
            }

            console.log(filteredData)
            branch = Object.assign(branch, filteredData);
            console.log(branch);
            // await branch.save();
            if (branch) {
                req.flash("success", "Branch Added Successfully");
                return res.redirect("/view_all_branch");
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