const jwt = require("jsonwebtoken");
const moment = require("moment-timezone");
const fs = require("fs");
const path = require("path");
const uniqid = require("uniqid");
const multer = require("multer");
const { Op } = require("sequelize");
const customError = require("../custom/errors");
const User = require("../models/user.js");
const Otp = require("../models/otp");
const Tokens = require("../models/tokens");
const Docs = require("../models/docs");

const { tokenGenerator, random, makeRandom, message, compareTime, generateOTP, hashPassword, sendMail } = require("../custom/functions");
const { getSignedURL, uploadFile, deleteFile } = require("../custom/s3");

const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join("./uploads")); // save the initial images in uploads folder
  },
  filename: function (req, file, cb) {
    cb(null, `${uniqid()}${file.originalname.replace(/\s/g, "")}`); // rename the image with a unique ID + file name
  },
});

// check the file format before saving....
const multerFilter = (req, file, cb) => {
  var ext = path.extname(file.originalname);
  if (ext == ".pdf" || ext == ".png" || ext == ".img" || ext == ".jpg" || ext == ".jpeg" || ext == ".PDF" || ext == ".PNG" || ext == ".IMG" || ext == ".JPG" || ext == ".JPEG") {
    cb(null, true);
  } else {
    cb("Only pdf and images are allowed", false);
  }
};

exports.uploadImage = multer({
  storage: imageStorage,
  fileFilter: multerFilter,
});

exports.signup = async (req, res) => {
  try {
    if (!req.body.email || !req.body.name || !req.body.number || !req.files) throw customError.dataInvalid;
    let user = await User.findOne({
      where: {
        [Op.or]: [{ email: req.body.email }, { number: req.body.number }],
      },
    });

    if (user) {
      if (user.status === "verified" || user.status === "unauthorized") throw customError.userExists;
      if (user.status === "created") {
        let docs = await Docs.findAll({ where: { user_id: user.id } });
        if (docs) {
          docs.map(async (doc) => {
            await deleteFile(doc.key);
            await doc.destroy();
          });
        }
        user.destroy();
      }
    }

    user = await User.create({
      name: req.body.name,
      email: req.body.email,
      number: req.body.number,
    });
    await Promise.all(
      req.files.map(async (file) => {
        key = await uploadFile(path.join(file.path), file.originalname);
        await Docs.create({ key: key.key, user_id: user.id });
        fs.unlinkSync(path.join(file.path));
      })
    );

    // generateOTP(4, user);

    res.status(200).json({
      error: false,
      details: {
        message: "User registered successfully",
      },
    });
  } catch (error) {
    console.log(`***** ERROR : ${req.originalUrl} ${error}`);
    return res.status(error.code).json({
      error: true,
      details: error,
    });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    if (!req.body.number || !req.body.otp) throw customError.dataInvalid;

    let user = await User.findOne({
      where: { number: req.body.number, status: "created" },
    });

    if (user == null) throw customError.userNotFound;

    let otp = await Otp.findOne({ where: { user_id: user.id } });

    if (otp.code != req.body.otp || compareTime(moment.tz(Date.now(), "ASIA/KOLKATA"), otp.valid_till) > 0) throw customError.authFailed;

    await user.save();
    await otp.destroy();
    res.status(200).json({
      error: false,
      details: {
        message: "User Verified Sucessfully!",
        token: await tokenGenerator(user),
        user: user,
      },
    });
  } catch (error) {
    console.log(`***** ERROR : ${req.originalUrl} ${error}`);
    return res.status(error.code || 500).json({
      error: true,
      details: error,
    });
  }
};

exports.sendOTP = async (req, res) => {
  try {
    if (!req.body.number) throw customError.dataInvalid;
    let user = await User.findOne({ where: { number: req.body.number, role: "customer" } });
    if (!user) throw customError.userNotFound;
    if (user.status == "created") throw customError.userUnderReview;
    let otp = await Otp.findOne({ where: { user_id: user.id } });
    if (otp) {
      if (compareTime(moment.tz(Date.now(), "ASIA/KOLKATA"), otp.valid_till) < 0) {
        throw customError.badRequest;
      } else {
        await otp.destroy();
      }
    }

    await generateOTP(4, user);

    res.status(200).json({
      error: false,
      details: {
        message: "OTP RESENT Successfully",
      },
    });
  } catch (error) {
    console.log(`***** ERROR : ${req.originalUrl} ${error}`);
    return res.status(error.code).json({
      error: true,
      details: error,
    });
  }
};

exports.login = async (req, res) => {
  try {
    if (!req.body.username || !req.body.otp) throw customError.dataInvalid;
    let user = await User.findOne({
      where: {
        [Op.or]: [{ email: req.body.username }, { number: req.body.username }],
        status: "verified",
        role: "customer",
      },
    });
    if (!user) throw customError.userNotFound;
    if (user.status === "unauthorized") throw customError.userBanned;
    let otp = await Otp.findOne({ where: { user_id: user.id } });
    if (!otp) throw customError.badRequest;
    if (otp.code != req.body.otp || compareTime(moment.tz(Date.now(), "ASIA/KOLKATA"), otp.valid_till) > 0) throw customError.authFailed;
    await otp.destroy();
    res.status(200).json({
      error: false,
      details: {
        token: await tokenGenerator(user),
        user: user,
      },
    });
  } catch (error) {
    console.log(`***** ERROR : ${req.originalUrl} ${error}`);
    return res.status(error.code).json({
      error: true,
      details: error,
    });
  }
};

exports.refresh = async (req, res) => {
  try {
    let access = req.body.access,
      refresh = req.body.refresh;

    if (!access || !refresh) throw customError.dataInvalid;
    let decodedRefresh = jwt.verify(refresh, process.env.JWT_KEY),
      valid = false;

    req.user = await User.findOne({ where: { id: decodedRefresh.id } });
    let tokens = await Tokens.findAll({ where: { user_id: req.user.id } });
    let ind;
    tokens.forEach((token, i) => {
      if (access == token.access && token.refresh == refresh) {
        ind = i;
        return (valid = true);
      }
    });
    if (!valid) throw customError.authFailed;
    res.status(200).json({
      error: false,
      details: {
        message: "Token Refreshed Sucessfully!",
        token: await tokenGenerator(req.user, { check: true, index: ind }),
      },
    });
  } catch (error) {
    console.log(`***** ERROR : ${req.originalUrl} ${error}`);
    return res.status(error.code || 401).json({
      error: true,
      details: error || {
        code: 401,
        name: "Authorization Failed! - Devloper Defined Error!",
        message: "Uh oh! i can't tell you anymore #BruteForcers! alert",
      },
    });
  }
};
