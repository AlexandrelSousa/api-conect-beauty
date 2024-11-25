// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const router = express.Router();
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

router.post('/login', async (req, res) => {
    console.log('Login endpoint foi acessado');
    try {
        const { emailOuCNPJ, senha } = req.body;
        console.log(`Dados recebidos para login: ${emailOuCNPJ}, ${senha}`);

        // Verificar se existe o cliente com o email
        const userQuery = await pool.query('SELECT * FROM cliente WHERE email = $1', [emailOuCNPJ]);
        // Verificar se existe a empresa com o CNPJ
        const empresaQuery = await pool.query('SELECT * FROM empreendedora WHERE cnpj = $1', [emailOuCNPJ]);

        if (userQuery.rows.length === 0 && empresaQuery.rows.length === 0) {
            console.log('Usuário ou empresa não encontrados');
            return res.status(401).json({ message: 'Dados de login incorretos' });
        }

        let user, isEmpresa = false;

        if (userQuery.rows.length > 0) {
            user = userQuery.rows[0];
        } else if (empresaQuery.rows.length > 0) {
            user = empresaQuery.rows[0];
            isEmpresa = true;
        }

        // Verificar a senha
        const senhaValida = await bcrypt.compare(senha, user.senha);

        if (!senhaValida) {
            console.log('Senha inválida');
            return res.status(401).json({ message: 'Nome de usuário ou senha incorretos' });
        }

        // Gerar o token JWT
        const acessToken = jwt.sign(
            {
                username: user.nome,
                cnpj: isEmpresa ? user.cnpj : null,  // Inclui o CNPJ se for empresa
                id: isEmpresa ? null : user.id  // Inclui o id se for cliente
            },
            process.env.ACESS_TOKEN_SECRET
        );

        res.json({ acessToken: acessToken });

    } catch (error) {
        console.error('Erro ao autenticar usuário:', error);
        res.status(500).json({ message: 'Erro ao autenticar usuário' });
    }
});

module.exports = router;
