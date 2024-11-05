// /api/app.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('./middleware/cors');
const upload = require('./config/multer');
const pool = require('./db');
const authRoutes = require('./routes/auth'); // Importando as rotas de autenticação
const clienteRoutes = require('./routes/clienteRoutes'); // Importando as rotas de cliente

dotenv.config();

const app = express();

app.use((req, res, next) => {
    console.log(`Requisição recebida: ${req.method} ${req.url}`);
    next();
});

app.use(cors);

app.use(express.json());

// Test Route
app.get('/', (req, res) => res.send('API is running'));

// Rota de autenticação
app.use('/api', authRoutes); // Usando as rotas de autenticação
app.use('/api/clientes', clienteRoutes);

// Rota para upload de arquivos
app.post('/upload', upload.single('file'), (req, res) => {
    res.send({ message: 'File uploaded successfully' });
});

// Exemplo de Rota de Conexão com o Banco de Dados
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
