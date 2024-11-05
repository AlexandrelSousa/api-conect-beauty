const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000 // 10 segundos
  });
  

// Testando a conexão
(async () => {
    try {
        const client = await pool.connect();
        console.log("Conexão bem-sucedida ao banco de dados!");
        client.release(); // Libera o cliente após a conexão
    } catch (err) {
        console.error("Erro ao conectar ao banco de dados:", err);
    }
})();

pool.connect();

module.exports = pool;
