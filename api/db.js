const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

pool.connect().then(() => {
    console.log("Conexão bem-sucedida ao banco de dados!");
}).catch(err => {
    console.error("Erro ao conectar ao banco de dados:", err);
});

module.exports = pool;
