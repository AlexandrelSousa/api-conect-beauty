const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

require('dotenv').config()

const pool = new Pool({
  connectionString: "postgres://default:xGO7Uf5oKbXa@ep-hidden-truth-a4dmmnpm-pooler.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require?sslmode=require",
})

pool.connect().then(() => {
    console.log("Conexão bem-sucedida ao banco de dados!");
}).catch(err => {
    console.error("Erro ao conectar ao banco de dados:", err);
});

module.exports = pool;
