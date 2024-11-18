const express = require('express');
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const upload = require('../config/multer'); 
const router = express.Router();

router.post('/cadastrar', upload.single('logo'), async (req, res) => {
    try {
        const logoPath = req.file ? req.file.path.replace(/\\/g, '/') : null;
        console.log(logoPath);

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
            classificacao: req.body.classificacao,
            inicio_expediente: req.body.inicio_expediente,
            fim_expediente: req.body.fim_expediente,
            dias_func: req.body.dias_func,
            logo: logoPath
        };

        for (const iterator of Object.keys(req.body)) {
            console.log(iterator);
            if (!req.body[iterator]) {
                const err = new Error(iterator + ' é obrigatório!');
                err.status = 400;
                return res.status(400).json({ message: iterator + ' é obrigatório!' });
            }
        }

        const cnpjJaExistente = await pool.query('SELECT * FROM empreendedora WHERE cnpj = $1', [req.body.cnpj]);
        if (cnpjJaExistente.rows.length > 0) {
            return res.status(400).json({ message: 'O CNPJ fornecido já está em uso.' });
        }

        const hashedPassword = await bcrypt.hash(req.body.senha, 10);

        const insertUserQuery = 'INSERT INTO empreendedora (cnpj, senha, nome, telefone, cidade, bairro, logradouro, numero, descricao, classificacao, dias_func, inicio_expediente, fim_expediente, logo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)';
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

module.exports = router;
