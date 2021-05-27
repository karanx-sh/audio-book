const moment = require("moment-timezone");
const Sequelize = require("sequelize");
const db = require("../../connection");
const docsSchema = {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  key: {
    type: Sequelize.STRING(512),
  },
  created_at: {
    type: Sequelize.STRING(256),
    defaultValue: moment.tz(Date.now(), "Asia/Kolkata").toString(),
  },
};

module.exports = db.define("docs", docsSchema, {
  freezeTableName: true,
});
