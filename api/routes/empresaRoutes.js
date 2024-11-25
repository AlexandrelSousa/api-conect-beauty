const express = require('express');
const pool = require('../db');
const bcrypt = require('bcryptjs');
const upload = require('../config/multer');
const cloudinary = require('../config/cloudinaryConfig'); // Importe a configuração do Cloudinary
const fs = require('fs'); // Adicione essa linha no topo do arquivo

const router = express.Router();

router.post('/cadastrar', upload.single('logo'), async (req, res) => {
    try {
        let logoUrl = null; // Aqui você vai armazenar a URL da imagem no Cloudinary

        if (req.file) {
            // Se o upload for bem-sucedido, o arquivo será automaticamente enviado para o Cloudinary
            // O arquivo não precisa mais ser removido do sistema de arquivos local
            logoUrl = req.file.path;  // O caminho para o arquivo será a URL do Cloudinary
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
            dias_func: req.body.dias_func, // Recebe como string
            logo: logoUrl
        };

        // Verifica campos obrigatórios
        for (const key of Object.keys(empresa)) {
            if (!empresa[key] && key !== 'logo') {
                return res.status(400).json({ message: `${key} é obrigatório!` });
            }
        }

        // Verifica duplicidade de CNPJ
        const cnpjJaExistente = await pool.query('SELECT * FROM empreendedora WHERE cnpj = $1', [empresa.cnpj]);
        if (cnpjJaExistente.rows.length > 0) {
            return res.status(400).json({ message: 'O CNPJ fornecido já está em uso.' });
        }

        // Gera hash da senha
        const hashedPassword = await bcrypt.hash(empresa.senha, 10);

        // Insere os dados no banco
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
            empresa.logo // Agora é a URL do Cloudinary
        ]);

        res.status(201).send('Empresa registrada com sucesso.');
    } catch (error) {
        console.error('Erro ao registrar empresa:', error);
        res.status(500).send('Erro ao registrar empresa.');
    }
});

router.get('/todas', async (req, res) => {
    try {
        // Consulta todas as empresas na tabela empreendedora
        const empresas = await pool.query('SELECT nome, descricao, cnpj, logo FROM empreendedora');

        // Verifica se foram encontradas empresas
        if (empresas.rows.length === 0) {
            return res.status(404).json({ error: 'Nenhuma empresa encontrada' });
        }

        // Retorna as informações das empresas
        res.json(empresas.rows);
    } catch (error) {
        console.error('Erro ao obter informações das empresas:', error);
        res.status(500).json({ error: 'Erro ao obter informações das empresas' });
    }
});

module.exports = router;
