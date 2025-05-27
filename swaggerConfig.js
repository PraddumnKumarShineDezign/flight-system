const swaggerAutogen = require('swagger-autogen')();
const config = require("./config");

const port = config?.config?.env?.server?.port || '3000';

const doc = {
  info: {
    title: 'Flight  System App API',
    version: '1.0.0',
    description: 'API for a Flight  System application.',
  },

  host: `localhost:${port}`,
  schemes: ['http'],
  components: {
    securitySchemes: {
      CustomHeaderAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'token',
        description: 'Custom token-based authentication',
      },
    },
  },
  security: [
    {
      CustomHeaderAuth: [],
    },
  ],
};

const outputFile = './swagger_output.json';
const endpointsFiles = ['./routes/index.js'];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  require('./app');
});