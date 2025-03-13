import userModel from "../module/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { genOtp, sendOtp } from "../utils/otp.js";
import crypto from "crypto";
import axios from "axios";
import paymentProcessModel from "../module/paymentProcessModel.js";
import branchModel from "../module/branchModel.js";
// Helper function to decode the token and fetch the user
async function getUserFromToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return await branchModel.findById(decoded.id, {
      branch_name: 1,
      branch_code: 1,
      userbalance: 1
    });
  } catch (error) {
    console.error("Error decoding token:", error.message);
    return null;
  }
}
async function getUserDetails(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return await userModel.findById(decoded.id);
  } catch (error) {
    console.error("Error decoding token:", error.message);
    return null;
  }
}

// Improved route handlers
export async function loginPage(req, res) {
  try {
    res.locals.message = req.flash();
    const user = req.cookies.authToken
      ? await getUserFromToken(req.cookies.authToken)
      : null;
    return res.render("login", { data: user });
  } catch (error) {
    req.flash("error", "login error");
    console.error("Error in loginPage:", error.message);
    return res.redirect("signup");
  }
}

export async function indexPage(req, res) {
  try {
    const user = req.cookies.authToken
      ? await getUserFromToken(req.cookies.authToken)
      : null;
    return res.render("index", { data: user });
  } catch (error) {
    console.error("Error in indexPage:", error.message);
    return res.redirect("signup");
  }
}

export async function registerPage(req, res) {
  try {
    res.locals.message = req.flash();
    const user = req.cookies.authToken
      ? await getUserFromToken(req.cookies.authToken)
      : null;
    return res.render("register", { data: user });
  } catch (error) {
    console.error("Error in registerPage:", error.message);
    return res.redirect("login");
  }
}

export async function profileUpdate(req, res) {
  try {
    const user = req.cookies.authToken
      ? await getUserDetails(req.cookies.authToken)
      : null;
    return res.render("complete-profile", { data: user });
  } catch (error) {
    console.error("Error in profileUpdate:", error.message);
    return res.redirect("login");
  }
}

export async function uploadDoc(req, res) {
  try {
    res.locals.message = req.flash();
    const user = req.cookies.authToken
      ? await getUserDetails(req.cookies.authToken)
      : ((docName = {
        matric: "",
        inter: "",
        NTT_certificate: "",
        image: "",
        sign: "",
      }),
        (isPaid = false));
    return res.render("document", {
      data: user,
    });
  } catch (error) {
    console.error("Error in uploadDoc:", error.message);
    return res.redirect("login");
  }
}

function generateToken(payload) {
  console.log("Generating token", payload);
  try {
    const authToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1D",
    });
    const refreshToken = jwt.sign({ id: payload._id }, process.env.JWT_SECRET, {
      expiresIn: "1M",
    });
    console.log("Generated tokens", authToken, refreshToken);
    return { authToken: authToken, refreshToken: refreshToken, status: "ok" };
  } catch (error) {
    return { authToken: "", refreshToken: "", error: error };
  }
}

async function generatePassword(password) {
  try {
    const salt = await bcrypt.genSalt(Number(process.env.SALT_ROUND));
    const hash = await bcrypt.hash(String(password), salt);
    return hash; // This will return the hash to the caller
  } catch (err) {
    console.error(err);
    throw new Error("Error generating password");
  }
}
// export async function registerUser(req, res, next) {
//   try {
//     console.log("req.body-->", req.body);
//     let { name, password, email, aadhar, mobile, tnc = false } = req.body;
//     const data = await userModel.findOne({ email });

//     const normalizedEmail = email.toLowerCase();

//     const existingUser = await userModel.findOne({
//       $or: [{ email: normalizedEmail }, { aadhar }, { mobile }],
//     });
//     if (existingUser) {
//       if (existingUser.isVerified) {
//         return res.status(400).json({
//           status: false,
//           message: "User already exists.",
//           data: existingUser,
//         });
//       } else {
//         const otp = await genOtp();
//         tnc == "on" ? (tnc = true) : tnc;

//         if (name && password) {
//           password = await generatePassword(password);
//           let user = new userModel({
//             name,
//             password,
//             role: "user",
//             email: normalizedEmail,
//             aadhar,
//             mobile,
//             tnc,
//             code: String(otp),
//           });
//           if (!user) {
//             return res
//               .status(400)
//               .json({ status: false, message: "Unable to create user" });
//           }
//           let sms = await sendOtp(
//             mobile,
//             `${otp} is the OTP for your BECCE account. NEVER SHARE YOUR OTP WITH ANYONE. -FANTASY`
//           );
//           if (!sms) {
//             return res
//               .status(400)
//               .json({ status: false, message: "Unable to send OTP" });
//           }
//           await user.save({ validateBeforeSave: false });

//           return res.status(200).json({
//             status: true,
//             message: "Your registered is successfully",
//             user,
//           });
//         }
//         return res.redirect("login");
//       }
//     }

//     const otp = await genOtp();
//     tnc == "on" ? (tnc = true) : tnc;

//     if (name && password) {
//       password = await generatePassword(password);
//       let user = new userModel({
//         name,
//         password,
//         role: "user",
//         email: normalizedEmail,
//         aadhar,
//         mobile,
//         tnc,
//         code: String(otp),
//       });
//       if (!user) {
//         return res
//           .status(400)
//           .json({ status: false, message: "Unable to create user" });
//       }
//       let sms = await sendOtp(
//         mobile,
//         `${otp} is the OTP for your BECCE account. NEVER SHARE YOUR OTP WITH ANYONE. -FANTASY`
//       );
//       if (!sms) {
//         return res
//           .status(400)
//           .json({ status: false, message: "Unable to send OTP" });
//       }
//       await user.save({ validateBeforeSave: false });

//       return res.status(200).json({
//         status: true,
//         message: "Your registered is successfully",
//         user,
//       });
//     }
//     return res.redirect("login");
//   } catch (err) {
//     console.log(err);
//     return res.status(400).json({
//       message: "Internal server error",
//       error: err,
//     });
//   }
// }

export async function registerUser(req, res, next) {
  try {
    console.log("req.body-->", req.body);
    let { name, password, email, aadhar, mobile, tnc = false } = req.body;
    const checkDetails = await userModel.findOne({
      $or: [{ email: email }, { aadhar: Number(aadhar) }, { mobile: Number(mobile) }],
      isVerified: true,
    });
    console.log(checkDetails, "checkDetails");
    if (checkDetails) {
      return res.status(400).json({
        status: false,
        message: "User already exists",
        data: checkDetails,
      });
    }
    const data = await userModel.findOne({ email });
    if (data) {
      if (!data.isVerified) {
        const otp = await genOtp();
        let sms = await sendOtp(
          mobile,
          `Your secure otp is ${otp}. Please do not share your otp with anyone. Regards, BIHAR EARLY CHILDHOOD CARE & EDUCATION - BECCE`,
          "otp"
        );
        // let sms = await sendOtp(
        //   mobile,
        //   `${otp} is the OTP for your BECCE account. NEVER SHARE YOUR OTP WITH ANYONE. -FANTASY`
        // );
        if (!sms) {
          return res
            .status(400)
            .json({ status: false, message: "Unable to send OTP" });
        }
        data.code = String(otp);
        data.name = name;
        data.aadhar = aadhar;
        data.mobile = mobile;
        data.password = await generatePassword(password);
        await data.save({ validateBeforeSave: false });
        return res.status(200).json({
          status: true,
          message: "Your registered is successfully",
          user: data,
        });
      }
      req.flash("error", "User already exists");
      return res
        .status(400)
        .json({ status: false, message: "User already exists", data: data });
    }
    const otp = await genOtp();
    tnc == "on" ? (tnc = true) : tnc;
    const normalizedEmail = email.toLowerCase();
    if (name && password) {
      let clearpass = password
      password = await generatePassword(password);
      let user = new userModel({
        name,
        password,
        role: "user",
        email: normalizedEmail,
        aadhar,
        mobile,
        cleanpass: clearpass,
        tnc,
        code: otp.toString(),
      });
      if (!user) {
        return res
          .status(400)
          .json({ status: false, message: "Unable to create user" });
      }
      let sms = await sendOtp(
        mobile,
        `Your secure otp is ${otp}. Please do not share your otp with anyone. Regards, BIHAR EARLY CHILDHOOD CARE & EDUCATION - BECCE`,
        "otp"
      );
      if (!sms) {
        return res
          .status(400)
          .json({ status: false, message: "Unable to send OTP" });
      }
      await user.save({ validateBeforeSave: false });

      return res.status(200).json({
        status: true,
        message: "Your registered is successfully",
        user,
      });
    }
    return res.redirect("login");
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      message: "Internal server error",
      error: err,
    });
  }
}

export async function registerOtp(req, res, next) {
  try {
    const { otp } = req.body;
    const userId = req.params.id;

    // Fetch only necessary fields to avoid loading unwanted data
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.code.toString() !== otp.toString()) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    // Ensure both values are compared as strings
    if (user.code.toString() == otp.toString()) {
      const payload = {
        id: user._id,
        email: user.email,
        role: user.role,
      };

      const token = generateToken(payload);

      if (token.status === "ok") {
        user.isVerified = true;
        await user.save();

        const smsMessage = `Dear ${user.name}, you are successfully registered as a Nursery Asst. Teacher. Your UserID: ${user.email}, Login Password: ${user.cleanpass}. -BRECCE`;

        // Ensure 'mobile' exists before sending SMS
        if (user.mobile) {
          await sendOtp(user.mobile, smsMessage, "register");
        }

        const cookieOptions = {
          httpOnly: true,
          secure: true, // Ensure HTTPS is used
          maxAge: 86400 * 1000, // 1 day in milliseconds
        };

        return res.status(200)
          .cookie("authToken", token.authToken, cookieOptions)
          .cookie("refreshToken", token.refreshToken, cookieOptions)
          .json({
            success: true,
            message: "Login successful",
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              mobile: user.mobile,
              role: user.role,
            },
            token,
            expiresIn: 86400, // Token expiry in seconds
          });
      }
      return res.status(500).json({ success: false, message: "Token generation failed" });
    }
  } catch (error) {
    console.error("Error in registerOtp:", error);
    return res.redirect("/api/login");
  }
}

export async function loginUser(req, res, next) {
  try {
    let { branch_code, password } = req.body;
    if (!branch_code && !password) {
      req.flash("error", "Invalid username or password");
      return res.redirect("login");
    }
    branch_code = branch_code.toLowerCase();
    const user = await branchModel.findOne({ branch_code });
    if (!user) {
      req.flash("error", "Invalid username or password");
      return res.redirect("login");
    }
    let checkPass = await bcrypt.compare(String(password), user.password);
    if (!checkPass) {
      req.flash("error", "Invalid username or password");
      return res.redirect("login");
    }
    // console.log(checkPass);
    if (checkPass) {
      let payload = {
        id: user._id,
        branch_code: user.branch_code,
        branch_name: user.branch_name,
      };
      const token = generateToken(payload);
      //   console.log(token);
      const options = {
        httpOnly: true,
        secure: true,
      };
      if (token.status === "ok") {
        return res
          .status(200)
          .cookie("authToken", token.authToken, options)
          .cookie("refreshToken", token.refreshToken, options)
          .redirect("branch_dashboard");
      }
    }
  } catch (error) {
    console.log(error);
    next();
  }
}

export async function completeProfile(req, res, next) {
  try {
    // console.log(req.body);
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    if (req.body) {
      Object.assign(user, req.body);
      await user.save({ validateBeforeSave: false });
      // res.redirect("login");
      res.redirect("uploadDoc");
    } else {
      // return res.status(400).json({ status: false, message: "Please provide user details" });
      return res.redirect("home");
    }
  } catch (error) {
    // return res.status(401).json({ status: false, message: "Internal server error" });
    return res.redirect("login");
  }
}

export async function uploadDocuments(req, res, next) {
  try {
    let user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    if (req.files) {
      let existingDocuments = user.documents || {};
      let existingDocNames = user.docName || {};

      for (let file in req.files) {
        file = req.files[file][0];

        if (file.fieldname === "image") {
          existingDocNames[file.fieldname] = file.originalname;
          user.image = `${file.fieldname}/${file.filename}`;
        } else if (file.fieldname === "sign") {
          existingDocNames[file.fieldname] = file.originalname;
          user.signature = `${file.fieldname}/${file.filename}`;
        } else {
          existingDocNames[file.fieldname] = file.originalname;
          existingDocuments[
            file.fieldname
          ] = `${file.fieldname}/${file.filename}`;
        }
      }

      user.documents = existingDocuments;
      user.docName = existingDocNames;

      await user.save({ validateBeforeSave: false });

      return res.status(200).redirect("uploadDoc");
    } else {
      return res
        .status(400)
        .json({ status: false, message: "No files uploaded" });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: false, message: "Internal server error" });
  }
}

export async function makePayment(req, res, next) {
  try {
    console.log("hitsss");
    let user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }
    let amounttype = "1000";
    user.category == "sc" || user.category == "st"
      ? (amounttype = "700")
      : (amounttype = "1000");
    try {
      if (req.query.amount) {
        amounttype = req.query.amount;
      }
      const merchantKey = process.env.MKEY;
      const merchantSalt = process.env.MSALT;
      const payuBaseURL = process.env.PAYURL;

      const txnId = `txn_${new Date().getTime()}`;
      const amount = amounttype;
      const productInfo = "fees";
      const customerName = user.name;
      const email = user.email;
      const phone = user.mobile;
      const hashString = `${merchantKey}|${txnId}|${amount}|${productInfo}|${customerName}|${email}|||||||||||${merchantSalt}`;
      const hash = crypto.createHash("sha512").update(hashString).digest("hex");

      const payment = await paymentProcessModel.create({
        txnid: txnId,
        amount: amount,
        userid: user._id,
        paymentMethod: "payu",
        status: "pending",
      });

      const paymentData = {
        key: merchantKey,
        txnid: txnId,
        amount: amount,
        productinfo: productInfo,
        firstname: customerName,
        email: email,
        phone: phone,
        surl: `${process.env.BASE_URL}success?id=${user._id}&paytoken=${payment._id}`,
        furl: `${process.env.BASE_URL}failure?id=${user._id}&paytoken=${payment._id}`,
        hash: hash,
        service_provider: "payu_paisa",
      };

      let response = await axios.post(payuBaseURL, paymentData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          accept: "application/json",
        },
      });
      return res.status(200).json({
        status: true,
        url: response.request.res.responseUrl,
      });
    } catch (error) {
      console.error(error);
      req.flash("error", "Payment failed");
      return res.redirect("/api/makePayment");
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: false, message: "Internal server error" });
  }
}

// export async function uploadDocumentsAndPayment(req, res, next) {
//   try {
//     let user = await userModel.findById(req.user.id);
//     if (!user) {
//       return res.status(404).json({ status: false, message: "User not found" });
//     }

//     if (req.files) {
//       let existingDocuments = user.documents || {};
//       let existingDocNames = user.docName || {};

//       for (let file in req.files) {
//         file = req.files[file][0];

//         if (file.fieldname === "image") {
//           existingDocNames[file.fieldname] = file.originalname;
//           user.image = `${file.fieldname}/${file.filename}`;
//         } else if (file.fieldname === "sign") {
//           existingDocNames[file.fieldname] = file.originalname;
//           user.signature = `${file.fieldname}/${file.filename}`;
//         } else {
//           existingDocNames[file.fieldname] = file.originalname;
//           existingDocuments[
//             file.fieldname
//           ] = `${file.fieldname}/${file.filename}`;
//         }
//       }

//       user.documents = existingDocuments;
//       user.docName = existingDocNames;

//       await user.save({ validateBeforeSave: false });

//       try {
//         const merchantKey = process.env.MKEY;
//         const merchantSalt = process.env.MSALT;
//         const payuBaseURL = process.env.PAYURL;

//         const txnId = `txn_${new Date().getTime()}`;
//         const amount = "1";
//         const productInfo = "fees";
//         const customerName = user.name;
//         const email = user.email;
//         const phone = user.mobile;
//         const hashString = `${merchantKey}|${txnId}|${amount}|${productInfo}|${customerName}|${email}|||||||||||${merchantSalt}`;
//         const hash = crypto
//           .createHash("sha512")
//           .update(hashString)
//           .digest("hex");
//         const payment = await paymentProcessModel.create({
//           txnId: txnId,
//           amount: amount,
//           userid: user._id,
//           paymentMethod: "payu",
//           status: "pending",
//         });
//         const paymentData = {
//           key: merchantKey,
//           txnid: txnId,
//           amount: amount,
//           productinfo: productInfo,
//           firstname: customerName,
//           email: email,
//           phone: phone,
//           surl: `${process.env.BASE_URL}success?id=${user._id}&paytoken=${payment._id}`, // Success URL
//           furl: `${process.env.BASE_URL}failure?id=${user._id}&paytoken=${payment._id}`, // Failure URL
//           hash: hash,
//           service_provider: "payu_paisa",
//         };

//         let response = await axios.post(payuBaseURL, paymentData, {
//           headers: {
//             "Content-Type": "application/x-www-form-urlencoded",
//             accept: "application/json",
//           },
//         });
//         res.redirect(response.request.res.responseUrl);
//       } catch (error) {
//         req.flash("erropr", "Payment failed");

//         console.log(error);
//         res.redirect("/api/uploadDoc");
//       }
//     } else {
//       res.status(400).json({ status: false, message: "No files uploaded" });
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ status: false, message: "Internal server error" });
//   }
// }

export async function logoutUser(req, res, next) {
  try {
    const user = await branchModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    };
    if (req.cookies) {
      res.clearCookie("authToken", options);
      res.clearCookie("refreshToken", options);
    }
    // return res.status(200).json({ status: true, message: "Successfully logged out" });
    return res.redirect("home");
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ status: false, message: "Logout failed" });
  }
}

export async function forgotPasswordPageOTPConfirm(req, res, next) {
  try {
    res.locals.message = req.flash();
    const user = req.cookies.authToken
      ? await getUserFromToken(req.cookies.authToken)
      : null;
    return res.render("forgotPassConfirm", { data: user });
  } catch (error) {
    console.error("Error in forgotPasswordPage:", error.message);
    return res.redirect("login");
  }
}
export async function forgotPasswordPage(req, res, next) {
  try {
    res.locals.message = req.flash();
    const user = req.cookies.authToken
      ? await getUserFromToken(req.cookies.authToken)
      : null;
    return res.render("forgotPass", { data: user });
  } catch (error) {
    console.error("Error in forgotPasswordPage:", error.message);
    return res.redirect("login");
  }
}

export async function forgotPassword(req, res, next) {
  try {
    res.locals.message = req.flash();
    const { mobile } = req.body;
    console.log(req.body, "req.body");
    const user = await userModel.findOne({ mobile });
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("login");
    }
    const otp = await genOtp();
    let sms = await sendOtp(
      mobile,
      `Your secure otp is ${otp}. Please do not share your otp with anyone. Regards, BIHAR EARLY CHILDHOOD CARE & EDUCATION - BECCE`,
      "otp"
    );
    if (!sms) {
      req.flash("error", "Unable to send OTP");
      return res.redirect("login");
    }
    user.code = String(otp);
    await user.save({ validateBeforeSave: false });
    return res.render("forgotPassOtp", {
      mobile: user.mobile,
      data: null,
    });
  } catch (error) {
    console.log(error);
    req.flash("error", "Internal server error");
    res.redirect("login");
  }
}
export async function verifyForgotOtp(req, res, next) {
  try {
    res.locals.message = req.flash();
    let { otp, mobile } = req.body;
    const data = await userModel.findOne({ mobile });
    if (String(data.code).trim() == String(otp).trim()) {
      return res.render("forgotPassConfirm", {
        mobile: data.mobile,
        data: null,
      });
    }
    req.flash("error", "Invalid OTP");
    return res.render("forgotPassOtp", {
      mobile: data.mobile,
      data: null,
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "SomeThing went wrong");
    return res.redirect("login");
  }
}
export async function updateForgotPass(req, res, next) {
  try {
    res.locals.message = req.flash();
    const { newPassword, mobile } = req.body;
    const data = await userModel.findOne({ mobile });
    if (!newPassword) {
      return render("forgotPassConfirm", {
        mobile: data.mobile,
        data: null,
      });
    }
    data.password = await generatePassword(newPassword);
    data.isVerified = true;
    await data.save({ validateBeforeSave: false });
    req.flash("success", "Password updated successfully");
    return res.redirect("login");
  } catch (error) {
    console.error(error);
    req.flash("error", "SomeThing went wrong");
    return res.redirect("login");
  }
}
