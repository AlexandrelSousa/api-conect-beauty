// /api/middleware/cors.js

const cors = require('cors');

// Função para configurar o middleware de CORS
const corsOptions = {
    origin: 'https://conect-beauty-app.vercel.app', // URL do front-end
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
};

const corsMiddleware = cors(corsOptions);

module.exports = corsMiddleware;
