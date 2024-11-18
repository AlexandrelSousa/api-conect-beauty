// /api/app.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('./middleware/cors');
const upload = require('./config/multer');
const pool = require('./db');
const authRoutes = require('./routes/auth');
const jwt = require('jsonwebtoken');
const clienteRoutes = require('./routes/clienteRoutes');
const empresaRoutes = require('./routes/empresaRoutes');


dotenv.config();

const app = express();

app.use((req, res, next) => {
    console.log(`Requisição recebida: ${req.method} ${req.url}`);
    next();
});

app.use(cors);

app.use(express.json());

// Test Route
app.get('/', (req, res) => {
    console.log('Rota / foi acessada');
    res.send('API is running');
});

app.use('/api', authRoutes);
console.log('Rota /api configurada');

app.use('/api/clientes', clienteRoutes);
console.log('Rota /api/clientes configurada');

app.post('/upload', upload.single('file'), (req, res) => {
    console.log('Rota /upload foi acessada');
    res.send({ message: 'File uploaded successfully' });
});

app.use('/api/empresa', empresaRoutes);
console.log('Rota /api/empresa configurada');

const PORT = 3030;
app.listen(PORT, () => {
    console.log(`Servidor inicializado na porta ${PORT}`);
});

module.exports = app;