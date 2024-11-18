// /api/routes/clienteRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db'); // Certifique-se de que o caminho para o arquivo db.js está correto
const jwt = require('jsonwebtoken');

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
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACESS_TOKEN_SECRET);
        const clientId = decoded.id;

        // Consulta ao banco de dados
        const client = await pool.query('SELECT * FROM cliente WHERE id = $1', [clientId]);

        if (client.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json(client.rows[0]);
    } catch (error) {
        console.error('Erro ao verificar o token ou ao consultar o banco de dados:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;

    if (!Number.isInteger(parseInt(id))) {
        return res.status(400).json({ error: 'ID inválido. O ID deve ser um número.' });
    }

    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    try {
        jwt.verify(token, process.env.ACESS_TOKEN_SECRET);

        const client = await pool.query('SELECT * FROM cliente WHERE id = $1', [id]);

        if (client.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        res.json(client.rows[0]);

    } catch (error) {
        console.error('Erro ao obter informações do cliente:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido ou expirado' });
        }

        res.status(500).json({ error: 'Erro interno no servidor ao obter informações do cliente' });
    }
});

router.put('/', async (req, res) => {
    const token = req.headers['authorization'];
    const { nome, senha, telefone, email } = req.body;

    if (!nome || !telefone || !email) {
        return res.status(400).json({ error: 'Nome, telefone e email são obrigatórios.' });
    }

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACESS_TOKEN_SECRET);
        const clientId = decoded.id;

        const clientExists = await pool.query('SELECT * FROM cliente WHERE id = $1', [clientId]);

        if (clientExists.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        let hashedPassword;
        if (senha) {
            hashedPassword = await bcrypt.hash(senha, 10);
        }

        const updateQuery = `
            UPDATE cliente 
            SET nome = $1, 
                senha = $2, 
                telefone = $3, 
                email = $4 
            WHERE id = $5
        `;
        
        await pool.query(updateQuery, [
            nome,
            senha ? hashedPassword : clientExists.rows[0].senha,
            telefone,
            email,
            clientId
        ]);

        res.json({ message: 'Cliente atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido ou expirado' });
        }
        res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
});

router.delete('/', async (req, res) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACESS_TOKEN_SECRET);
        const clientId = decoded.id;

        const clientExists = await pool.query('SELECT * FROM cliente WHERE id = $1', [clientId]);

        if (clientExists.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        await pool.query('DELETE FROM agendamento WHERE id_cli = $1', [clientId]);

        await pool.query('DELETE FROM cliente WHERE id = $1', [clientId]);

        res.json({ message: 'Cliente deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar cliente:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido ou expirado' });
        }
        res.status(500).json({ error: 'Erro ao deletar cliente' });
    }
});


module.exports = router;
