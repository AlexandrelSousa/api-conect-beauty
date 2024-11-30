const express = require('express');
const pool = require('../db');
const bcrypt = require('bcryptjs');
const upload = require('../config/multer');
const cloudinary = require('../config/cloudinaryConfig');
const fs = require('fs'); 
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/', async (req, res) => {
    const token = req.headers['authorization'];

    try {
        const empresaCnpj = jwt.decode(token).cnpj;

        const { nome, descricao, duracao, preco, categoria } = req.body;

        const camposObrigatorios = { nome, descricao, duracao, preco, categoria };
        for (const [campo, valor] of Object.entries(camposObrigatorios)) {
            if (!valor) {
                return res.status(400).json({ message: `${campo} é obrigatório!` });
            }
        }

        const nomeJaExistente = await pool.query(
            'SELECT * FROM procedimento WHERE nome = $1 AND cnpj = $2',
            [nome, empresaCnpj]
        );
        if (nomeJaExistente.rows.length > 0) {
            return res.status(400).json({ message: 'O procedimento fornecido já existe em sua conta.' });
        }

        const insertProcedimentoQuery = `
            INSERT INTO procedimento (nome, descricao, duracao, preco, categoria, cnpj)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await pool.query(insertProcedimentoQuery, [
            nome,
            descricao,
            duracao,
            preco,
            categoria,
            empresaCnpj,
        ]);

        res.status(201).json({ message: 'Procedimento registrado com sucesso.' });
    } catch (error) {
        console.error('Erro ao registrar procedimento:', error);
        res.status(500).json({ message: 'Erro ao registrar procedimento.' });
    }
});

router.put('/', async (req, res) => {
    try {
        const token = req.headers['authorization'];
        const { nome, descricao, duracao, preco, categoria, nome_antigo } = req.body;

        if (!token) {
            return res.status(401).json({ error: 'Token de autorização não fornecido.' });
        }

        const decodedToken = jwt.decode(token);
        if (!decodedToken || !decodedToken.cnpj) {
            return res.status(401).json({ error: 'Token inválido ou CNPJ não encontrado no token.' });
        }

        const empresaId = decodedToken.cnpj;

        const procedimentoFind = await pool.query(
            'SELECT * FROM procedimento WHERE cnpj = $1 AND nome = $2',
            [empresaId, nome_antigo]
        );

        if (procedimentoFind.rowCount === 0) {
            return res.status(404).json({ error: 'Procedimento não encontrado.' });
        }

        const procedimentoExists = await pool.query(
            'SELECT * FROM procedimento WHERE cnpj = $1 AND nome = $2',
            [empresaId, nome]
        );

        if (procedimentoExists.rowCount > 0) {
            return res.status(400).json({ error: 'Já existe um procedimento com este nome em sua conta.' });
        }

        const updateQuery = `
            UPDATE procedimento 
            SET nome = $1, descricao = $2, duracao = $3, preco = $4, categoria = $5
            WHERE cnpj = $6 AND nome = $7
        `;
        await pool.query(updateQuery, [nome, descricao, duracao, preco, categoria, empresaId, nome_antigo]);

        res.json({ message: 'Informações do procedimento atualizadas com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar procedimento:', error);
        res.status(500).json({ error: 'Erro ao atualizar informações do procedimento.' });
    }
});


router.delete('/', async (req, res) => {
    try {
        const token = req.headers['authorization'];
        const { nome, id_pro } = req.body;

        if (!token) {
            return res.status(401).json({ error: 'Token de autorização não fornecido.' });
        }

        const decodedToken = jwt.decode(token);
        if (!decodedToken || !decodedToken.cnpj) {
            return res.status(401).json({ error: 'Token inválido ou CNPJ não encontrado no token.' });
        }

        const empresaId = decodedToken.cnpj;

        const procedimentoExists = await pool.query(
            'SELECT * FROM procedimento WHERE nome = $1 AND cnpj = $2',
            [nome, empresaId]
        );

        if (procedimentoExists.rowCount === 0) {
            return res.status(404).json({ error: 'Procedimento não encontrado.' });
        }

        await pool.query('DELETE FROM agendamento WHERE id_pro = $1', [id_pro]);

        await pool.query('DELETE FROM procedimento WHERE nome = $1 AND cnpj = $2', [nome, empresaId]);

        res.json({ message: 'Procedimento e agendamentos associados deletados com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar procedimento:', error);
        res.status(500).json({ error: 'Erro ao deletar procedimento.' });
    }
});


router.get('/filtro', async (req, res) => {
    try {
        const { categoria } = req.query;

        if (!categoria) {
            return res.status(400).json({ error: 'Categoria é obrigatória!' });
        }

        const procedimentosFiltrados = await pool.query(
            'SELECT cnpj FROM procedimento WHERE categoria = $1',
            [categoria]
        );

        if (procedimentosFiltrados.rowCount === 0) {
            console.log('Nenhum procedimento encontrado com a categoria especificada.');
            return res.json([]);
        }

        const procedimentoCnpjs = procedimentosFiltrados.rows.map(row => row.cnpj);

        const empresasComFiltro = await pool.query(
            'SELECT cnpj, nome, descricao FROM empreendedora WHERE cnpj = ANY($1)',
            [procedimentoCnpjs]
        );

        res.json(empresasComFiltro.rows);
    } catch (error) {
        console.error('Erro ao consultar procedimentos:', error);
        res.status(500).json({ error: 'Erro ao consultar procedimentos.' });
    }
});

router.get('/:cnpj', async (req, res) => {
    try {
        const { cnpj } = req.params;

        if (!cnpj) {
            return res.status(400).json({ error: 'CNPJ é obrigatório!' });
        }

        const procedimentos = await pool.query('SELECT * FROM procedimento WHERE cnpj = $1', [cnpj]);

        if (procedimentos.rowCount === 0) {
            console.log('Nenhum procedimento encontrado para este CNPJ.');
            return res.json([]);
        }

        res.json(procedimentos.rows);
    } catch (error) {
        console.error('Erro ao consultar procedimentos:', error);
        res.status(500).json({ error: 'Erro ao consultar procedimentos.' });
    }
});

router.get('/', async (req, res) => {
    try {
        const token = req.headers['authorization'];

        if (!token) {
            return res.status(401).json({ error: 'Token de autorização não fornecido.' });
        }

        const decodedToken = jwt.decode(token);
        if (!decodedToken || !decodedToken.cnpj) {
            return res.status(401).json({ error: 'Token inválido ou CNPJ não encontrado no token.' });
        }

        const empresaCnpj = decodedToken.cnpj;

        const procedimentos = await pool.query(
            'SELECT * FROM procedimento WHERE cnpj = $1',
            [empresaCnpj]
        );

        if (procedimentos.rowCount === 0) {
            return res.status(404).json({ error: 'Nenhum procedimento encontrado para este CNPJ.' });
        }

        res.json(procedimentos.rows);
    } catch (error) {
        console.error('Erro ao obter informações do procedimento:', error);
        res.status(500).json({ error: 'Erro ao obter informações do procedimento.' });
    }
});


module.exports = router;