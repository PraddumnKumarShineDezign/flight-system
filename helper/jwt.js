const jwt = require('jsonwebtoken');
const config = require('../config')

function verifyToken(token) {
    try {
        let decoded = jwt.verify(token, config?.config?.env?.jwtSecret || "Flight-System-Secret");
        return { err: null, result: decoded }
    } catch (error) {
        console.error('JWT Verification Error:', error?.message);
        return { err: error, result: null }
    }
}

function signToken(payload) {
    try {
        if (!payload) {
            console.error("Payload is required to sign the token");
            return null;
        }
        let token = jwt.sign(payload && JSON.stringify(payload), config?.config?.env?.jwtSecret || "Flight-System-Secret");
        return token;
    } catch (error) {
        console.log("error=>", error);
        return null
    }
}

module.exports = {
    signToken,
    verifyToken
}