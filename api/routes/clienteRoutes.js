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

module.exports = router;
