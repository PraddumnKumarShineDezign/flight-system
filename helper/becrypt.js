const bcrypt = require('bcrypt')

function generatePassword(data) {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(data, salt);
}

function comparePassword(pass, encPass) {
    return bcrypt.compareSync(pass, encPass)
}

module.exports = {
    generatePassword,
    comparePassword
}