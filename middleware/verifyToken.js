const { verifyToken } = require('../helper/jwt');
const { statusCode } = require('../helper/statusCodes');
const { UserModel } = require('../models/users');

const verifyAuthToken = async (req, res, next) => {
    try {
        const token = req.headers.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(statusCode.UNAUTHORIZED).json({ message: "Unauthorized: No token provided" });
        }

        const { err, result } = verifyToken(token);

        if (err || !result || !result._id) {
            return res.status(statusCode.UNAUTHORIZED).json({ message: err?.message || "Unauthorized: Invalid token" });
        }

        const user = await UserModel.findOne({ _id: result._id });

        if (!user || user.status === 'Inactive' || user.isDeleted) {
            return res.status(statusCode.UNAUTHORIZED).json({ message: "Unauthorized: User inactive or deleted" });
        }

        req.decoded = user;
        next();

    } catch (error) {
        console.error("Auth error:", error);
        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
};

module.exports = {
    verifyAuthToken
};

