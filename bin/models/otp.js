const moment = require("moment-timezone");
const Sequelize = require("sequelize");
const db = require("../../connection");
const otpSchema = {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  code: {
    type: Sequelize.STRING(256),
  },
  valid_till: {
    type: Sequelize.STRING(256),
  },
  message_sent_at: {
    type: Sequelize.STRING(256),
    defaultValue: moment.tz(Date.now(), "Asia/Kolkata").toString(),
  },
};

module.exports = db.define("otp", otpSchema, {
  freezeTableName: true,
});
