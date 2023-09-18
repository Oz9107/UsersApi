const EmailCode = require("./EmailCode");
const User = require("./User");

EmailCode.belongsTo(User);
User.hasOne(EmailCode);

//ESTA ES UNA RELACION 1 A 1
