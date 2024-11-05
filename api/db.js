const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL
});

pool.connect().then(() => {
    console.log("Conexão bem-sucedida ao banco de dados!");
}).catch(err => {
    console.error("Erro ao conectar ao banco de dados:", err);
});

module.exports = pool;
