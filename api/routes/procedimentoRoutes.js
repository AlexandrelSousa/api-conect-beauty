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

        const { nome, descricao, duracao, preco, categoria, classificacao } = req.body;

        const camposObrigatorios = { nome, descricao, duracao, preco, categoria, classificacao };
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
            INSERT INTO procedimento (nome, descricao, duracao, preco, categoria, classificacao, cnpj)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        await pool.query(insertProcedimentoQuery, [
            nome,
            descricao,
            duracao,
            preco,
            categoria,
            classificacao,
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
        const { data, hora_inicio, hora_fim, id_emp, id_cli, id_pro } = req.body;

        if (!data || !hora_inicio || !hora_fim || !id_emp || !id_cli || !id_pro) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios!' });
        }

        const updateQuery = `
            UPDATE agendamento 
            SET data = $1, hora_inicio = $2, hora_fim = $3, id_pro = $4 
            WHERE id_emp = $5 AND id_cli = $6
        `;
        await pool.query(updateQuery, [data, hora_inicio, hora_fim, id_pro, id_emp, id_cli]);

        res.json({ message: 'Informações do agendamento atualizadas com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar agendamento:', error);
        res.status(500).json({ error: 'Erro ao atualizar informações do agendamento.' });
    }
});

router.delete('/', async (req, res) => {
    try {
        const { data, hora_inicio } = req.body;

        if (!data || !hora_inicio) {
            return res.status(400).json({ error: 'Os campos "data" e "hora_inicio" são obrigatórios!' });
        }

        const agendamentoExists = await pool.query(
            'SELECT * FROM agendamento WHERE data = $1 AND hora_inicio = $2',
            [data, hora_inicio]
        );

        if (agendamentoExists.rowCount === 0) {
            return res.status(404).json({ error: 'Agendamento não encontrado.' });
        }

        await pool.query('DELETE FROM agendamento WHERE data = $1 AND hora_inicio = $2', [data, hora_inicio]);

        res.json({ message: 'Agendamento deletado com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar agendamento:', error);
        res.status(500).json({ error: 'Erro ao deletar agendamento.' });
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

function horarioEstaNoIntervalo(horario, inicioIntervalo, fimIntervalo) {
    const iniIntDate = "2024-04-20T" + inicioIntervalo + ":00"
    const fimIntDate = "2024-04-20T" + fimIntervalo + ":00"
    const horarioIntDate = "2024-04-20T" + horario

    const horarioDate = new Date(horarioIntDate);
    const inicioIntervaloDate = new Date(iniIntDate);
    const fimIntervaloDate = new Date(fimIntDate);

    return horarioDate >= inicioIntervaloDate && horarioDate <= fimIntervaloDate;
}

module.exports = router;