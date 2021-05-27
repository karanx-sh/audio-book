const moment = require("moment-timezone");
const Sequelize = require("sequelize");
const db = require("../../connection");

const UserSchema = {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING(256),
  },
  number: {
    type: Sequelize.STRING(256),
    unique: true,
  },
  email: {
    type: Sequelize.STRING(256),
    unique: true,
  },
  role: {
    type: Sequelize.STRING(256),
    defaultValue: "customer",
  },
  status: {
    type: Sequelize.STRING(256),
    defaultValue: "created",
  },
  created_at: {
    type: Sequelize.STRING(256),
    defaultValue: moment.tz(Date.now(), "Asia/Kolkata").toString(),
  },
};

module.exports = db.define("user", UserSchema, {
  freezeTableName: true,
});
