const express = require('express');
const pool = require('../db');
const bcrypt = require('bcryptjs');
const upload = require('../config/multer');
const cloudinary = require('../config/cloudinaryConfig');
const fs = require('fs'); 

const router = express.Router();

router.post('/cadastrar', upload.single('logo'), async (req, res) => {
    try {
        let logoUrl = null;

        if (req.file) {
            logoUrl = req.file.path;
        }

        const empresa = {
            cnpj: req.body.cnpj,
            senha: req.body.senha,
            nome: req.body.nome,
            telefone: req.body.telefone,
            cidade: req.body.cidade,
            bairro: req.body.bairro,
            logradouro: req.body.logradouro,
            numero: req.body.numero,
            descricao: req.body.descricao,
            classificacao: req.body.classificacao || '0',
            inicio_expediente: req.body.inicio_expediente,
            fim_expediente: req.body.fim_expediente,
            dias_func: req.body.dias_func,
            logo: logoUrl
        };

        for (const key of Object.keys(empresa)) {
            if (!empresa[key] && key !== 'logo') {
                return res.status(400).json({ message: `${key} é obrigatório!` });
            }
        }

        const cnpjJaExistente = await pool.query('SELECT * FROM empreendedora WHERE cnpj = $1', [empresa.cnpj]);
        if (cnpjJaExistente.rows.length > 0) {
            return res.status(400).json({ message: 'O CNPJ fornecido já está em uso.' });
        }

        const hashedPassword = await bcrypt.hash(empresa.senha, 10);

        const insertUserQuery = `
            INSERT INTO empreendedora (
                cnpj, senha, nome, telefone, cidade, bairro, logradouro, numero,
                descricao, classificacao, dias_func, inicio_expediente, fim_expediente, logo
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `;
        await pool.query(insertUserQuery, [
            empresa.cnpj,
            hashedPassword,
            empresa.nome,
            empresa.telefone,
            empresa.cidade,
            empresa.bairro,
            empresa.logradouro,
            empresa.numero,
            empresa.descricao,
            empresa.classificacao,
            empresa.dias_func,
            empresa.inicio_expediente,
            empresa.fim_expediente,
            empresa.logo
        ]);

        res.status(201).send('Empresa registrada com sucesso.');
    } catch (error) {
        console.error('Erro ao registrar empresa:', error);
        res.status(500).send('Erro ao registrar empresa.');
    }
});

router.get('/todas', async (req, res) => {
    try {
        const empresas = await pool.query('SELECT nome, descricao, cnpj, logo FROM empreendedora');

        if (empresas.rows.length === 0) {
            return res.status(404).json({ error: 'Nenhuma empresa encontrada' });
        }

        res.json(empresas.rows);
    } catch (error) {
        console.error('Erro ao obter informações das empresas:', error);
        res.status(500).json({ error: 'Erro ao obter informações das empresas' });
    }
});

router.get('/', async (req, res) => {
    const token = req.headers['authorization'];

    try {
        const decodedToken = jwt.decode(token);

        if (!decodedToken || !decodedToken.cnpj) {
            console.log('Token inválido ou ausente');
            return res.status(401).json({ error: 'Token inválido ou ausente' });
        }

        const empresaCnpj = decodedToken.cnpj;

        const empresaQuery = await pool.query(
            'SELECT nome, descricao, cnpj, telefone, email, logo FROM empreendedora WHERE cnpj = $1',
            [empresaCnpj]
        );

        if (empresaQuery.rows.length === 0) {
            console.log('Empresa não encontrada para o CNPJ:', empresaCnpj);
            return res.status(404).json({ error: 'Empresa não encontrada' });
        }

        res.json(empresaQuery.rows[0]);
    } catch (error) {
        console.error('Erro ao obter informações da empresa:', error);
        res.status(500).json({ error: 'Erro ao obter informações da empresa' });
    }
});

router.get('/:id', async (req, res) => {
    const empresaId = req.params.id;

    try {
        // Consulta o banco de dados para obter as informações da empresa
        const empresaQuery = await pool.query(
            'SELECT * FROM empreendedora WHERE cnpj = $1',
            [empresaId]
        );

        // Verifica se a empresa foi encontrada
        if (empresaQuery.rows.length === 0) {
            console.log(`Empresa com ID ${empresaId} não encontrada`);
            return res.status(404).json({ error: 'Empresa não encontrada' });
        }

        // Retorna as informações da empresa
        res.json(empresaQuery.rows[0]);

    } catch (error) {
        console.error('Erro ao obter informações da empresa:', error);
        res.status(500).json({ error: 'Erro ao obter informações da empresa' });
    }
});


module.exports = router;
