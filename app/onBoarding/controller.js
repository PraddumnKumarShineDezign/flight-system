const {UserModel} = require("../../models/users");
const { comparePassword, generatePassword } = require("../../../helper/bcrypt");
const { message } = require("../../../constants/messages");
const { signToken } = require('../../../helper/jwt');
const config = require("../../../config");


module.exports = {
  /**
   * @description User login
   */
  login: async (req, res) => {
      try {
          const { email, password } = req.body;

         
          const userExists = await UserModel.findOne({email: email, isDeleted: false}, { password: 1, isEmailVerified: 1, status: 1});
          if (userExists) {
             
              if (user.isEmailVerified) {
                  let isPassSame = comparePassword(password, _p || "");
                  if (isPassSame) {
                      user.token = signToken(user);
                      return res.status(200).send({ message: message.LOGIN_SUCSS, data: user })
                  }
              } else {
                  return res.status(200).send({
                      message: message.VERIFY_EMAIL,
                      data: { sendReVerifyMail: true }  
                  })
              }
          } else {

              if (pannel == "player") {
                  return res.status(400).send({ message: message.ACC_NE })
              } else if (pannel == "admin") {
                  return res.status(400).send({ message: "Account not found. Please sign up first." })
              } else {
                  return res.status(400).send({ message: "An account could not be found with this email. Please check your email address and try again. If the issue persists, contact the administrator for assistance." })
              }
          }
      } catch (error) {
          console.log(error);
          return res.status(400).send({ message: error.message || message.SMTHG_WRNG })
      }
  },
}