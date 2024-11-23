const express = require('express');
const pool = require('../db');
const bcrypt = require('bcryptjs');
const upload = require('../config/multer');
const fs = require('fs');

const router = express.Router();

router.post('/cadastrar', upload.single('logo'), async (req, res) => {
    try {
        console.log("Recebendo dados...");
        let logoBuffer = null;
        if (req.file) {
            console.log("Arquivo recebido:", req.file);
            logoBuffer = fs.readFileSync(req.file.path); // Verificar se o caminho é válido
        }

        console.log("Criando objeto da empresa...");
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
            logo: logoBuffer,
        };

        console.log("Validando campos...");
        for (const iterator of Object.keys(req.body)) {
            console.log(`Campo ${iterator}:`, req.body[iterator]);
            if (!req.body[iterator]) {
                const err = new Error(iterator + ' é obrigatório!');
                err.status = 400;
                return res.status(400).json({ message: iterator + ' é obrigatório!' });
            }
        }

        console.log("Checando CNPJ no banco...");
        const cnpjJaExistente = await pool.query('SELECT * FROM empreendedora WHERE cnpj = $1', [req.body.cnpj]);
        if (cnpjJaExistente.rows.length > 0) {
            console.error("CNPJ já existe!");
            return res.status(400).json({ message: 'O CNPJ fornecido já está em uso.' });
        }

        console.log("Criptografando senha...");
        const hashedPassword = await bcrypt.hash(req.body.senha, 10);

        console.log("Inserindo dados no banco...");
        const insertUserQuery = `
            INSERT INTO empreendedora 
            (cnpj, senha, nome, telefone, cidade, bairro, logradouro, numero, descricao, classificacao, dias_func, inicio_expediente, fim_expediente, logo) 
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
            empresa.logo,
        ]);

        console.log("Empresa cadastrada com sucesso!");
        res.status(201).send('Empresa registrada com sucesso.');
    } catch (error) {
        console.error('Erro ao registrar empresa:', error); // Log completo do erro
        res.status(500).send('Erro ao registrar empresa.');
    }
});
