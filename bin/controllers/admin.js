const jwt = require("jsonwebtoken");
const moment = require("moment-timezone");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");

const customError = require("../custom/errors");
const User = require("../models/user.js");
const Docs = require("../models/docs");
const Otp = require("../models/otp");
const Tokens = require("../models/tokens");
const { tokenGenerator, random, makeRandom, message, compareTime, generateOTP, hashPassword, sendMail } = require("../custom/functions");
const cloud = require("../custom/cloud");

exports.signup = async (req, res) => {
  try {
    if (!req.body.email || !req.body.name || !req.body.number || !req.body.password) throw customError.dataInvalid;
    let user = await User.findOne({
      where: {
        [Op.or]: [{ email: req.body.email }, { number: req.body.number }],
      },
    });
    if (user) throw customError.userExists;
    user = await User.create({
      name: req.body.name,
      email: req.body.email,
      number: req.body.number,
      password: req.body.password,
      role: "admin",
      status: "verified",
    });

    res.status(200).json({
      error: false,
      details: {
        message: "Admin registered successfully",
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
    if (!req.body.username || !req.body.password) throw customError.dataInvalid;
    let user = await User.findOne({
      where: {
        [Op.or]: [{ email: req.body.username }, { number: req.body.username }],
        status: "verified",
        role: "admin",
      },
    });
    if (!user) throw customError.userNotFound;
    if (bcrypt.compareSync(req.body.password, user.password)) {
      res.status(200).json({
        error: false,
        details: {
          token: await tokenGenerator(user),
          user: user,
        },
      });
    } else {
      res.status(401).json({
        error: true,
        details: {
          message: "Username or Password is incorrect!!!",
        },
      });
    }
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

// user Controllers

exports.verifyUser = async (req, res) => {
  try {
    if (!req.body.id) throw customError.dataInvalid;
    let user = await User.findOne({ where: { id: req.body.id, role: "customer" } });
    await user.update({
      status: "verified",
    });
    res.status(200).json({
      error: false,
      details: {
        message: "user verified successfully",
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

exports.listUsers = async (req, res) => {
  try {
    let user = await User.findAll({ where: { role: "customer", status: { [Op.ne]: "init" } } });

    res.status(200).json({
      error: false,
      details: {
        message: "customer found successfully",
        data: user,
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

exports.BanUser = async (req, res) => {
  try {
    if (!req.body.id) throw customError.dataInvalid;
    let user = await User.findOne({ where: { id: req.body.id, role: "customer", status: "verified" } });
    await user.update({
      status: "unauthorized",
    });
    res.status(200).json({
      error: false,
      details: {
        message: "user unauthorized successfully",
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

//get Book Signed url
exports.getDocSigned = async (req, res) => {
  try {
    if (!req.body.id) throw customError.dataInvalid;
    let docs = await Docs.findAll({ where: { user_id: req.body.id } });
    if (!docs) throw customError.dataNotFound;
    url = [];
    await Promise.all(
      docs.map(async (doc) => {
        url.push(await cloud.getsignedUrl(process.env.AWS_CDN_DOMAIN, doc.key, 1));
      })
    );
    res.status(200).json({
      error: false,
      details: {
        message: "User Document found",
        docs: url,
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
