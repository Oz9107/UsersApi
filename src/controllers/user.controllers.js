const catchError = require("../utils/catchError");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const sendEmail = require("../utils/sendEmail");
const EmailCode = require("../models/EmailCode");
const jwt = require("jsonwebtoken");

const getAll = catchError(async (req, res) => {
  const results = await User.findAll();
  return res.json(results);
});

const create = catchError(async (req, res) => {
  const { firstName, lastName, email, password, country, image, frontBaseUrl } =
    req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    country,
    image,
  });
  const code = require("crypto").randomBytes(32).toString("hex"); //estp crea un codigo
  const link = `${frontBaseUrl}/auth/verify_email/${code}`;

  await EmailCode.create({
    code,
    userId: result.id,
  });

    await sendEmail({
      to: email,
      subject: "Verify your email for user app",
      html: `
        <h1>Hello ${firstName} ${lastName}</h1>
        <p>Thanks for signing up for the user app. Please verify your email by clicking the link below: </p> <br>
        <a href="${link}">${link}</a>
      `,
    });
  return res.status(201).json(result);
});

const getOne = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await User.findByPk(id);
  if (!result) return res.sendStatus(404);
  return res.json(result);
});

const remove = catchError(async (req, res) => {
  const { id } = req.params;
  await User.destroy({ where: { id } });
  return res.sendStatus(204);
});

const update = catchError(async (req, res) => {
  const { id } = req.params;
  delete req.body.password;
  delete req.body.email;
  delete req.body.isVerified;
  const result = await User.update(req.body, {
    where: { id },
    returning: true,
  });
  if (result[0] === 0) return res.sendStatus(404);
  return res.json(result[1][0]);
});

const verifyEmail = catchError(async (req, res) => {
  const { code } = req.params;
  const emailCode = await EmailCode.findOne({ where: { code } }); //recibe y busca el EmailCode
  if (!emailCode) return res.status(401).json({ message: "Invalid code" }); // mostramos el mensaje 401 si no encuentra el codigo
  const user = await User.update(
    //aca cambiamos el verify a true
    { isVerified: true },
    { where: { id: emailCode.userId }, returning: true }
  );
  //ahora eliminamos el codigo verificado
  await emailCode.destroy();
  return res.json(user); // si todo salio bien retorna el usuario verificado
});

//para realizar el login y vericar si esta login
const login = catchError(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(401).json({ message: "Invalid credentials" });
  if (!user.isVerified)
    return res.status(401).json({ message: "User must be verifed" });
  //vinculamos el token
  const token = jwt.sign({ user }, process.env.TOKEN_SECRET, {
    expiresIn: "1d",
  });
  return res.json({ user, token });
});

const getLoggedUser = catchError(async (req, res) => {
  const user = req.user;
  return res.json(user);
});

module.exports = {
  getAll,
  create,
  getOne,
  remove,
  update,
  verifyEmail,
  login,
  getLoggedUser,
};
