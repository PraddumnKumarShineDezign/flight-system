var local = {
    'env': {
        name: 'flight-system-backend',
        allowedOrigins: ['*'],
        server: {
            host: '127.0.0.1',
            port: '4001'
        },
        database: {
            name: 'flight-system',
            debug: false
        },
        jwtSecret: "Flight-System-Secret",
        maxFileUpload: 10,
        frontendURL: 'http://192.168.0.149:4200/',
        projectName: 'flight-system-backend'
    },
    'smtp': {
        host: 'smtp.gmail.com',
        port: 587,
        tls: {
            rejectUnauthorized: false
        },
        auth: {
            user: 'example@gmail.com',
            pass: '45645'
        }
    },
};

module.exports = { config: local };
