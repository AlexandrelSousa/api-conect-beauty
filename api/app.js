// /api/app.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('./middleware/cors');
const upload = require('./config/multer');
const pool = require('./db');

dotenv.config();

const app = express();
app.use(express.json());

// CORS Middleware
//app.use((req, res, next) => cors(req, res, next));

// Test Route
app.get('/', (req, res) => res.send('API is running'));

// Sample User Route
app.post('/upload', upload.single('file'), (req, res) => {
    res.send({ message: 'File uploaded successfully' });
});

// Pool Connection Example
app.get('/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
});

// Configurar o servidor para ouvir em uma porta
const PORT = 3030;
app.listen(PORT, () => {
    console.log(`Servidor inicializado na porta ${PORT}`);
});

module.exports = app;
