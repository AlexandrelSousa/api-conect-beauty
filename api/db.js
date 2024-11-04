const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.connect().then(() => {
    console.log("Conexão bem-sucedida ao banco de dados!");
}).catch(err => {
    console.error("Erro ao conectar ao banco de dados:", err);
});

module.exports = pool;
