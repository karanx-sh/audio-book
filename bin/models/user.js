const moment = require("moment-timezone");
const Sequelize = require("sequelize");
const db = require("../../connection");
const bcrypt = require("bcryptjs");

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
  password: {
    type: Sequelize.STRING(256),
  },
  role: {
    type: Sequelize.STRING(256),
    defaultValue: "customer",
  },
  status: {
    type: Sequelize.STRING(256),
    defaultValue: "init",
  },
  created_at: {
    type: Sequelize.STRING(256),
    defaultValue: moment.tz(Date.now(), "Asia/Kolkata").toString(),
  },
};

User = db.define("user", UserSchema, {
  freezeTableName: true,
});

function hashPassword(password) {
  return bcrypt.hash(password, bcrypt.genSaltSync(8));
}

User.beforeCreate(async (user, options) => {
  const hashedPassword = await hashPassword(user.password);
  user.password = hashedPassword;
});

module.exports = User;
