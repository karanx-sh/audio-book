const jwt = require("jsonwebtoken");
const moment = require("moment-timezone");

const customError = require("../custom/errors");
const User = require("../models/user");
const Tokens = require("../models/tokens");

const { compareTime } = require("../custom/functions");

exports.checkCustomer = async (req, res, next) => {
  try {
    if (!req.headers.authorization) throw customError.authFailed;
    let access = req.headers.authorization.split(" ")[1],
      decodedUser = jwt.verify(access, process.env.JWT_KEY),
      valid = false;

    req.user = await User.findOne({ where: { id: decodedUser.id, status: "verified", role: "customer" } });
    tokens = await Tokens.findAll({ where: { user_id: req.user.id } });
    tokens.forEach((token) => {
      if (access == token.access) return (valid = true);
    });
    if (!valid) throw customError.authFailed;
    next();
  } catch (error) {
    console.log(error);
    return res.status(error.code || 401).json({
      error: true,
      details: {
        code: error.code || 401,
        name: error.name || "Authorization Failed!",
        message: `Uh oh! i can't tell you anymore #BruteForcers! alert`,
      },
    });
  }
};

exports.checkAdmin = async (req, res, next) => {
  try {
    if (!req.headers.authorization) throw customError.authFailed;
    let access = req.headers.authorization.split(" ")[1],
      decodedUser = jwt.verify(access, process.env.JWT_KEY),
      valid = false;

    req.user = await User.findOne({ where: { id: decodedUser.id, role: "admin" } });
    tokens = await Tokens.findAll({ where: { user_id: req.user.id } });
    tokens.forEach((token) => {
      if (access == token.access) return (valid = true);
    });
    if (!valid) throw customError.authFailed;

    next();
  } catch (error) {
    console.log(error);
    return res.status(error.code || 401).json({
      error: true,
      details: {
        code: error.code || 401,
        name: error.name || "Authorization Failed!",
        message: `Uh oh! i can't tell you anymore #BruteForcers! alert`,
      },
    });
  }
};
