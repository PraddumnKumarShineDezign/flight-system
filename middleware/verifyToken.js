const { messages } = require('../helper/messages.js');
const Helper = require('../helper/common.js');
const { statusCode } = require('../helper/statusCodes.js');
const helperObj = new Helper();
const { ObjectId } = require('mongodb');

const { UserModel } = require('../models/users.js');

const verifyToken = async (req, res, next) => {
    try {
        let token = req.headers.token;
        if (!token) return helperObj.responseObj(res, statusCode.UNAUTHORIZED, {}, "Unauthorized user. Please login to continue.");
        helperObj.verifyToken(token, "secretToken", async (err, result) => {
            if (err) {
                return helperObj.responseObj(res, statusCode.UNAUTHORIZED, err, "It seems your session has been expired. Please login again to continue.");
            }
            else {
                let userData = await UserModel.findOne({ _id: ObjectId(result?._id) }).lean();
                if (!userData || userData.isDeleted || !userData.isActive) {
                    return helperObj.errorObj(res, statusCode.UNAUTHORIZED, messages.INVALID_TOKEN)
                }

                req.userDetail = userData;
                req.userId = result?._id;
                req.hash = userData.password;
                req.userName = `${userData.firstName} ${userData.lastName}`
                next();
            }
        })
    }
    catch (err) {
        console.log("verify token middleware error occure", err?.message || err);
        return helperObj.responseObj(res, statusCode.INTERNAL_SERVER_ERROR, err.messages, messages.INVALID_TOKEN)
    }
}
module.exports = {
    verifyToken
}