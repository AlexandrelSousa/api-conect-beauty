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
app.use((req, res, next) => cors(req, res, next));

// Test Route
app.get('/', async (req, res) => {
    try {
        // Exemplo de uma simples consulta para verificar se a conexão com o banco está funcionando
        const result = await pool.query('SELECT NOW()'); // Verifica a hora atual no banco de dados
        res.send(`API is running. Server time: ${result.rows[0].now}`);
    } catch (error) {
        console.error("Erro ao consultar o banco de dados:", error); // Log do erro
        res.status(500).send("Internal Server Error"); // Resposta de erro
    }
});

module.exports = app;
