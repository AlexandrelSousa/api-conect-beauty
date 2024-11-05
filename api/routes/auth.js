// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
    console.log('Login endpoint foi acessado'); // Log para confirmar acesso
    try {
        const { emailOuCNPJ, senha } = req.body;
        console.log(`Dados recebidos para login: ${emailOuCNPJ}, ${senha}`); // Log dos dados recebidos

        const userQuery = await pool.query('SELECT * FROM cliente WHERE email = $1', [emailOuCNPJ]);
        if (userQuery.rows.length === 0) {
            console.log('Usuário não encontrado');
            return res.status(400).json({ error: 'Usuário não encontrado' });
        }

        const user = userQuery.rows[0];
        const senhaValida = await bcrypt.compare(senha, user.senha);

        if (!senhaValida) {
            console.log('Senha inválida');
            return res.status(400).json({ error: 'Senha inválida' });
        }

        const acessToken = jwt.sign({username: cnpj.rows[0].nome, cnpj: cnpj.rows[0].cnpj}, process.env.ACESS_TOKEN_SECRET);

        res.json({ message: 'Autenticação bem-sucedida', acessToken: acessToken });

    } catch (error) {
        console.error('Erro ao autenticar usuário:', error);
        res.status(500).json({ error: 'Erro ao autenticar usuário' });
    }
});

module.exports = router;
