import depositModel from "../module/depositModel.js";
import transactionModel from "../module/transactionModel.js";
import randomstring from "randomstring";
import userModel from "../module/userModel.js";
import branchModel from "../module/branchModel.js";


export async function depositRequest(req, res, next) {
    try {
        const user = await branchModel.findOne({ _id: req.user.id });
        if (!user) {
            return {
                message: "Invalid Details.",
                status: false,
                data: {},
            };
        }
        const checkDeposit = await depositModel.findOne({
            userId: req.user.id,
            userTransactionId: req.body.userTransactionId
        });
        console.log("hitsss")
        if (checkDeposit) {
            return res.status(200).json({
                message: "You have already submitted the deposit request.",
                status: false,
                data: {},
            });
        }
        let obj = {};
        if (req.body.typename)
            obj.image = `${req.file.fieldname}/${req.file.filename}`;

        let randomStr = randomstring.generate({
            length: 4,
            charset: 'alphabetic',
            capitalization: 'uppercase'
        });
        const txnid = `deposit-${Date.now()}${randomStr}`;
        obj.transaction_id = txnid
        obj.userId = req.user.id;
        obj.amount = Number(req.body.amount);
        obj.userTransactionId = req.body.userTransactionId;
        obj.utr_number = req.body.utr_number;
        console.log('obj', obj)
        let transactionObj = {
            userid: req.user.id,
            type: 'Cash added',
            transaction_id: txnid,
            transaction_by: "web",
            amount: obj.amount,
            paymentstatus: "Pending",
            bonus_amt: 0,
            win_amt: 0,
            addfund_amt: obj.amount,
            bal_fund_amt: user.userbalance?.balance + obj.amount || 0,
            total_available_amt:
                user.userbalance?.balance + obj.amount || 0,
        }
        console.log('transaction', transactionObj)
        await transactionModel.create(transactionObj);
        let deposit = await depositModel.create(obj);
        req.flash("success", "Payment request successfully submitted.");
        return res.redirect("add-payments")
    } catch (error) {
        req.flash("error", "something went wrong");
        return res.redirect("add-payments");
    }
}


export async function getDeposit(req, res, next) {
    try {
        const data = async () => {
            try {
                const getDeposit = await depositModel.find({
                    userId: req.user.id
                }, {
                    amount: 1, image: {
                        $concat: [`${process.env.BASE_URL}`, "$image"],
                    }, userId: 1, status: 1, userTransactionId: 1
                });
                return {
                    message: "Get list of deposits",
                    status: true,
                    data: getDeposit,
                };
            } catch (error) {
                throw error;
            }
        };
        return res.status(200).json(Object.assign({ success: true }, data));
    } catch (error) {
        next(error);
    }
}




