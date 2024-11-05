// /api/db.js
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Cria um pool de conexões usando a variável de ambiente POSTGRES_URL
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false } // Necessário para conexões com Neon
});

// Testa a conexão com o banco de dados
pool.connect()
    .then(() => {
        console.log("Conexão bem-sucedida ao banco de dados!");
    })
    .catch(err => {
        console.error("Erro ao conectar ao banco de dados:", err);
    });

module.exports = pool;
