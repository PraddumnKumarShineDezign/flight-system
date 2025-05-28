const mongoose = require('mongoose');
const { config } = require('./config.js');

mongoose.set('debug', config.env.database.debug);
mongoose.set('strictQuery', false);

let options = {
    useNewUrlParser: true,
    autoIndex: false
};

class DB {
    static connect() {
        mongoose.connect('mongodb://127.0.0.1:27017/' + config.env.database.name, options, function (err, db) {
            if (err) {
                console.log('Unable to connect to the mongoDB server. Error:', err);
            } else {
                console.log('Connected to ' + config.env.database.name);
            }
        });
    }
}

module.exports = DB;