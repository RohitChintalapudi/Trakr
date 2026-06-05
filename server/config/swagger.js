const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Enterprise Field Force Management Ecosystem API',
      version: '1.0.0',
      description: 'API documentation for hierarchy management, geo-fenced check-ins, and status tracking.',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js', './server/routes/*.js'], // covers path regardless of execution context
};

const specs = swaggerJsdoc(options);

module.exports = specs;
