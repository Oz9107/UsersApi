const { DataTypes } = require("sequelize");
const sequelize = require("../utils/connection");

const EmailCode = sequelize.define("emailCode", {
  code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  //userId, esto es con llaves foreanas ya sea uno a muchos o muchos a muchos
  //crear el index.js en models y luego importar a server.js
});

module.exports = EmailCode;
