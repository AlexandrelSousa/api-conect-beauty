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

        // Expressão regular simples para verificar se é um CNPJ
        const isCNPJ = /^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$/.test(emailOuCNPJ);
        let userQuery;

        // Verifica se é CNPJ ou Email e define a query correta
        if (isCNPJ) {
            console.log("Tentando autenticar com CNPJ");
            // Remove a pontuação do CNPJ antes de consultar o banco
            const cnpjFormatado = emailOuCNPJ.replace(/[^\d]+/g, ''); // Remove tudo que não for número
            console.log(`CNPJ formatado para consulta: ${cnpjFormatado}`);

            userQuery = await pool.query('SELECT * FROM empresa WHERE cnpj = $1', [cnpjFormatado]);
        } else {
            console.log("Tentando autenticar com Email");
            userQuery = await pool.query('SELECT * FROM cliente WHERE email = $1', [emailOuCNPJ]);
        }

        // Verifica se o usuário existe
        if (userQuery.rows.length === 0) {
            console.log('Usuário não encontrado');
            return res.status(400).json({ error: 'Usuário não encontrado' });
        }

        const user = userQuery.rows[0];
        console.log(`Usuário encontrado: ${user.nome} - CNPJ: ${user.cnpj} - Email: ${user.email}`);

        const senhaValida = await bcrypt.compare(senha, user.senha);

        if (!senhaValida) {
            console.log('Senha inválida');
            return res.status(400).json({ error: 'Senha inválida' });
        }

        // Gera o token JWT com os dados específicos do usuário
        const acessToken = jwt.sign(
            { 
                username: user.nome, 
                cnpj: isCNPJ ? user.cnpj : null, // inclui cnpj se for uma empresa
                id: isCNPJ ? null : user.id // inclui id se for um cliente
            }, 
            process.env.ACESS_TOKEN_SECRET
        );

        res.json({ message: 'Autenticação bem-sucedida', acessToken: acessToken });

    } catch (error) {
        console.error('Erro ao autenticar usuário:', error);
        res.status(500).json({ error: 'Erro ao autenticar usuário' });
    }
});

module.exports = router;
