const moment = require("moment-timezone");
const Sequelize = require("sequelize");
const db = require("../../connection");
const booksSchema = {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  title: {
    type: Sequelize.STRING(256),
  },
  key: {
    type: Sequelize.STRING(512),
  },
  created_at: {
    type: Sequelize.STRING(256),
    defaultValue: moment.tz(Date.now(), "Asia/Kolkata").toString(),
  },
};

module.exports = db.define("books", booksSchema, {
  freezeTableName: true,
});
