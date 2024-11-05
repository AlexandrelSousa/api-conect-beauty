// /api/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

router.post('/login', async (req, res) => {
    const { emailOuCNPJ, senha } = req.body;

    try {
        const user = await pool.query('SELECT * FROM cliente WHERE email = $1', [emailOuCNPJ]);
        const cnpjUser = await pool.query('SELECT * FROM empreendedora WHERE cnpj = $1', [emailOuCNPJ]);

        if (user.rows.length === 0 && cnpjUser.rows.length === 0) {
            return res.status(401).json({ message: 'Dados de login incorretos.' });
        }

        let validPassword;
        let acessToken;

        if (cnpjUser.rows.length > 0) {
            validPassword = await bcrypt.compare(senha, cnpjUser.rows[0].senha);
            if (!validPassword) {
                return res.status(401).json({ message: 'Nome de usuário ou senha incorretos' });
            }
            acessToken = jwt.sign({ username: cnpjUser.rows[0].nome, cnpj: cnpjUser.rows[0].cnpj }, process.env.ACESS_TOKEN_SECRET);
        } else {
            validPassword = await bcrypt.compare(senha, user.rows[0].senha);
            if (!validPassword) {
                return res.status(401).json({ message: 'Nome de usuário ou senha incorretos' });
            }
            acessToken = jwt.sign({ username: user.rows[0].nome, id: user.rows[0].id }, process.env.ACESS_TOKEN_SECRET);
        }

        res.json({ acessToken });
    } catch (error) {
        console.error('Erro ao processar login:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

module.exports = router;
