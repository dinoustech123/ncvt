import axios from "axios";


export async function genOtp() {
    return Math.floor(1000 + Math.random() * 9000);
}


export async function sendOtp(mobile, message, type) {
    console.log("---mobile--and otp", mobile, "..message--",
        message, "--process.env.BULKSMS_AUTH_KEY---",
        process.env.BULKSMS_AUTH_KEY, "--process.env.BULKSMS_SENDER--",
        process.env.BULKSMS_SENDER, "--process.env.BULKSMS_ROUTE--",
        process.env.BULKSMS_ROUTE)
    let t_id = "1107173763986204946"
    if (type === "otp") {
        t_id = "1107173763986204946"
    }
    if (type === "register") {
        t_id = "1107173763977604363"
    }
    let payload = {
        "campaign_name": 'OTP',
        "auth_key": process.env.BULKSMS_AUTH_KEY,
        "receivers": Number(mobile),
        "sender": process.env.BULKSMS_SENDER,
        "route": 'TR',
        "message": {
            "msgdata": message,
            "Template_ID": t_id,
            'coding': 1
        },
    }

    let headers = {
        'Content-Type': 'application/json'
    }
    axios.post(
        `http://sms.bulksmsserviceproviders.com/api/send/sms`, payload
    )
        .then(function (response) {
            // console.log('...............................the response is', response.data);
            return response;
        })
        .catch(function (error) {
            console.log('AXIOS message API ERROR-- ', error);
            // reject(error);
        });
    return true;

} 
