const jwt = require("jsonwebtoken");
const moment = require("moment-timezone");
const customError = require("../custom/errors");
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const Otp = require("../models/otp");
const Tokens = require("../models/tokens");

let AccessLimit = (tokens) => {
  let length = tokens.length;
  if (length < process.env.MAXCONCURRENTLOGINS) {
    return true;
  } else {
    return false;
  }
};
const tokenGenerator = async (user, update = { check: false }, resetTokens = false) => {
  try {
    let accessExpiry = parseInt(process.env.ACCESSEXPIRY, 10),
      refreshExpiry = parseInt(process.env.REFRESHEXPIRY, 10),
      access = jwt.sign({ id: user.id, type: "access" }, process.env.JWT_KEY, {
        expiresIn: accessExpiry,
      }),
      refresh = jwt.sign({ id: user.id, type: "refresh" }, process.env.JWT_KEY, { expiresIn: refreshExpiry });
    let tokens = await Tokens.findAll({ where: { user_id: user.id }, order: [["created_at", "ASC"]] });
    if (resetTokens) {
      tokens.map(async (token) => {
        await token.destroy();
      });
    }
    if (update.check) {
      await tokens[update.index].update({
        access: access,
        refresh: refresh,
        created_at: moment.tz(Date.now(), "Asia/Kolkata").toString(),
      });
    } else {
      if (AccessLimit(tokens)) {
        await Tokens.create({
          access: access,
          refresh: refresh,
          created_at: moment.tz(Date.now(), "Asia/Kolkata").toString(),
          user_id: user.id,
        });
      } else {
        await tokens[0].destroy();
        await Tokens.create({
          access: access,
          refresh: refresh,
          created_at: moment.tz(Date.now(), "Asia/Kolkata").toString(),
          user_id: user.id,
        });
      }
    }

    return {
      access: {
        token: access,
        expiryin: accessExpiry,
      },
      refresh: {
        token: refresh,
        expiryin: refreshExpiry,
      },
    };
  } catch (error) {
    console.log(error);
    return error;
  }
};

const random = (length) => {
  let code = Math.random().toString().split(".")[1].slice(0, length);
  if (code.length !== length) {
    code = random;
  }
  return code;
};

const nseries = (length) => {
  arr = [];
  for (let i = 1; i <= length; i++) {
    arr.push(i);
  }
  return arr;
};

const makeRandom = (length) => {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
const message = (to, message) => {
  console.log(`${message} sent to ${to} via message`);
  return true; //text.send(to, message);
};

const compareTime = (time1, time2, condition = 1) => {
  switch (condition) {
    case 1:
      return (new Date(time1) - new Date(time2)) / 1000;
  }
};

const generateOTP = async (length, user) => {
  (code = random(length)), (validTill = moment.tz(new Date(Date.now() + process.env.OTPVALIDINMIN * 60000), "ASIA/KOLKATA").toString()), (messageText = `${code} is the OTP for the action initiated at ${process.env.PROJECTNAME}, this code is valid till ${validTill.split(" ")[4].slice(0, 5)}\n#HaveAGoodTime`);
  if (!message(user.number, messageText)) throw customError.serverDown;
  let otp = await Otp.findOne({ where: { user_id: user.id } });
  if (otp) await otp.destroy();

  await Otp.create({
    user_id: user.id,
    code: code,
    valid_till: validTill,
    message_sent_at: moment.tz(Date.now(), "ASIA/KOLKATA").toString(),
  });
  // sendMail(code, user.email, "Email Otp");
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, bcrypt.genSaltSync(8));
};

const sendMail = async (otp, to, subject) => {
  var transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  data = await ejs.renderFile(__dirname + "/test.ejs", {
    otp: otp,
  });

  var mailOptions = {
    from: process.env.MAIL_FROM,
    to: to,
    subject: subject,
    html: data,
    replyTo: process.env.REPLY_TO,
  };
  transport.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log("Message sent: %s", info.messageId);
  });
};

module.exports = {
  tokenGenerator,
  random,
  makeRandom,
  message,
  compareTime,
  generateOTP,
  nseries,
  hashPassword,
  sendMail,
};
