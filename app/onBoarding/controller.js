const { UserModel } = require("../../models/users");
const { comparePassword } = require("../../helper/becrypt");
const { messages } = require("../../helper/messages");
const { signToken } = require('../../helper/jwt');


module.exports = {
    /**
     * @description User login
     */
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            const user = await UserModel.findOne(
                { email, isDeleted: false },
                { password: 1, isEmailVerified: 1, status: 1, firstName: 1, lastName: 1, email: 1 }
            );

            if (!user) {
                return res.status(404).send({ message: messages?.USER_NF });
            }

            if (!user.isEmailVerified) {
                return res.status(200).send({
                    message: message.VERIFY_EMAIL,
                    data: { sendReVerifyMail: true }
                });
            }

            const isPassValid = await comparePassword(password, user.password);
            if (!isPassValid) {
                return res.status(401).send({ message: "Invalid email or password" });
            }

            const token = signToken(user);
            const userData = {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                status: user.status,
                token
            };

            return res.status(200).send({
                message: messages?.LOGIN_SUCCESS || "Login successfully",
                data: userData
            });

        } catch (error) {
            console.error("Login error:", error);
            return res.status(500).send({ message: error.message || messages?.SMTHG_WRNG });
        }
    }

}