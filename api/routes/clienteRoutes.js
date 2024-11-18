// /api/routes/clienteRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db'); // Certifique-se de que o caminho para o arquivo db.js está correto

const router = express.Router();

router.post('/cadastro', async (req, res) => {
    try {
        const user = {
            email: req.body.email,
            username: req.body.username,
            senha: req.body.senha,
            telefone: req.body.telefone,
            confirmSenha: req.body.confirmSenha
        };

        if (!req.body.username) {
            return res.status(400).send('Nome de usuário é obrigatório!');
        }
        if (!req.body.senha) {
            return res.status(400).send('Senha é obrigatória!');
        }
        if (!req.body.telefone) {
            return res.status(400).send('Telefone é obrigatório!');
        }
        if (!req.body.confirmSenha) {
            return res.status(400).send('Confirmação da senha é obrigatória!');
        }
        if (req.body.confirmSenha !== req.body.senha) {
            return res.status(400).send('As senhas não conferem!');
        }
        if (!req.body.email) {
            return res.status(400).send('O campo email é obrigatório!');
        }

        // Verificando se o email já existe
        const emailJaExistente = await pool.query('SELECT * FROM cliente WHERE email = $1', [req.body.email]);
        if (emailJaExistente.rows.length > 0) {
            return res.status(400).json({ message: 'O email fornecido já está em uso.' });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(req.body.senha, 10);
        
        const insertUserQuery = 'INSERT INTO cliente (nome, senha, telefone, email) VALUES ($1, $2, $3, $4)';
        await pool.query(insertUserQuery, [user.username, hashedPassword, user.telefone, user.email]);
        
        res.status(201).send('Usuário registrado com sucesso.');
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).send('Erro ao registrar usuário.');
    }
});

router.get('/', async (req, res) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.ACESS_TOKEN_SECRET);
    console.log("inhaaaaaaaiiiii" + decoded)

    try {
        const decoded = jwt.verify(token, process.env.ACESS_TOKEN_SECRET);
        console.log("inhaaaaaaaiiiii" + decoded)
        if (!decoded.id) {
            return res.status(401).json({ error: 'Token inválido' });
        }

        const clientId = decoded.id;

        const clientQuery = await pool.query('SELECT * FROM cliente WHERE id = $1', [clientId]);

        if (clientQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json(clientQuery.rows[0]);

    } catch (error) {
        console.error('Erro ao obter informações do usuário:', error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token inválido ou expirado' });
        }
        res.status(500).json({ error: 'Erro ao obter informações do usuário' });
    }
});

module.exports = router;


module.exports = router;
