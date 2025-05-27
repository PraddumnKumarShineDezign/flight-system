const swagToken = (req, res, next) => {
    /* #swagger.parameters['token'] = {
          in: 'header',
          description: 'string',
          required: true,
      } */
    next();
};

module.exports = {
    swagToken,
};