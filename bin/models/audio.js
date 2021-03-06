const moment = require("moment-timezone");
const Sequelize = require("sequelize");
const db = require("../../connection");
const audioSchema = {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  title: {
    type: Sequelize.STRING(2048),
  },
  code: {
    type: Sequelize.STRING(256),
  },
  createdAt: {
    type: Sequelize.STRING(256),
    defaultValue: moment.tz(Date.now(), "Asia/Kolkata").format("DD/MM/YYYY"),
  },
};

module.exports = db.define("audio", audioSchema, {
  freezeTableName: true,
});
