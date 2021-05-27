const jwt = require("jsonwebtoken");
const moment = require("moment-timezone");
const { Op } = require("sequelize");
const customError = require("../custom/errors");
const User = require("../models/user.js");
const Otp = require("../models/otp");
const Tokens = require("../models/tokens");
const { tokenGenerator, random, makeRandom, message, compareTime, generateOTP, hashPassword, sendMail } = require("../custom/functions");

exports.signup = async (req, res) => {
  try {
    console.log(req.body.number);
    if (!req.body.email || !req.body.name || !req.body.number) throw customError.dataInvalid;
    let user = await User.findOne({
      where: {
        [Op.or]: [{ email: req.body.email }, { number: req.body.number }],
      },
    });

    if (user) {
      if (user.status === "verified" || user.status === "unauthorized") throw customError.userExists;
      if (user.status === "created") {
        user.destroy();
      }
    }

    user = await User.create({
      name: req.body.name,
      email: req.body.email,
      number: req.body.number,
    });
    generateOTP(4, user);

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
