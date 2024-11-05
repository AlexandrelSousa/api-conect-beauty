// /api/app.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('./middleware/cors');
const upload = require('./config/multer');
const pool = require('./db');
const authRoutes = require('./routes/auth'); // Importando as rotas de autenticação

dotenv.config();

const app = express();
app.use(express.json());

// Test Route
app.get('/', (req, res) => res.send('API is running'));

// Rota de autenticação
app.use('/api', authRoutes); // Usando as rotas de autenticação

// Configurar o servidor para ouvir em uma porta
const PORT = 3030;
app.listen(PORT, () => {
    console.log(`Servidor inicializado na porta ${PORT}`);
});

module.exports = app;
