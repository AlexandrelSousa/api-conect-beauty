const express = require('express');
const pool = require('../db');
const bcrypt = require('bcryptjs');
const upload = require('../config/multer');
const cloudinary = require('../config/cloudinaryConfig');
const fs = require('fs'); 
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/', async (req, res) => {
    console.log('Dados recebidos:', req.body);
    const token = req.headers['authorization'];
    
    try {
        const clienteId = jwt.decode(token).id;
        if (!clienteId) {
            return res.status(401).json({ error: 'Token inválido ou cliente não autenticado.' });
        }

        const { id_pro, cnpj, data, hora_inicio, hora_fim } = req.body;

        const camposObrigatorios = { id_pro, cnpj, data, hora_inicio, hora_fim };
        for (const [campo, valor] of Object.entries(camposObrigatorios)) {
            if (!valor) {
                return res.status(400).json({ error: `${campo} é obrigatório!` });
            }
        }

        const diasFuncResult = await pool.query('SELECT dias_func, inicio_expediente, fim_expediente FROM empreendedora WHERE cnpj = $1', [cnpj]);
        if (diasFuncResult.rowCount === 0) {
            return res.status(404).json({ error: 'Empresa não encontrada.' });
        }

        const { dias_func, inicio_expediente, fim_expediente } = diasFuncResult.rows[0];
        const diaDaSemana = new Date(data).getDay();

        if (!dias_func[diaDaSemana]) {
            return res.status(400).json({ error: 'O estabelecimento não funciona no dia solicitado.' });
        }

        if (!horarioEstaNoIntervalo(hora_inicio, inicio_expediente, fim_expediente) ||
            !horarioEstaNoIntervalo(hora_fim, inicio_expediente, fim_expediente)) {
            return res.status(400).json({ error: 'Horário fora do expediente do estabelecimento.' });
        }

        const agendamentosExistentes = await pool.query(
            'SELECT hora_inicio, hora_fim FROM agendamento WHERE id_emp = $1 AND data = $2',
            [cnpj, data]
        );

        const horarioDisponivel = agendamentosExistentes.rows.every(({ hora_inicio: inicioExistente, hora_fim: fimExistente }) => {
            const inicioNovo = new Date(`1970-01-01T${hora_inicio}:00`);
            const fimNovo = new Date(`1970-01-01T${hora_fim}:00`);
            const inicioExist = new Date(`1970-01-01T${inicioExistente}:00`);
            const fimExist = new Date(`1970-01-01T${fimExistente}:00`);
            
            return (fimNovo <= inicioExist || inicioNovo >= fimExist); // Sem sobreposição
        });

        if (!horarioDisponivel) {
            return res.status(400).json({ error: 'Já existe outro agendamento nesse horário.' });
        }

        const insertQuery = `
            INSERT INTO agendamento (id_cli, id_pro, id_emp, data, hora_inicio, hora_fim)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await pool.query(insertQuery, [clienteId, id_pro, cnpj, data, hora_inicio, hora_fim]);

        res.status(201).json({ message: 'Agendamento registrado com sucesso!' });

    } catch (error) {
        console.error('Erro ao registrar agendamento:', error);
        res.status(500).json({ error: 'Erro ao registrar agendamento.' });
    }
});

router.get('/', async (req, res) => {
    const token = req.headers['authorization'];
    let id, agendamento;

    try {
        const decodedToken = jwt.decode(token);

        if (!decodedToken) {
            return res.status(401).json({ error: 'Token inválido ou não fornecido.' });
        }

        if (decodedToken.cnpj) {
            id = decodedToken.cnpj;
            agendamento = await pool.query(
                `SELECT ag.*, cli.nome AS cliente_nome, pro.nome AS procedimento_nome 
                 FROM agendamento ag
                 JOIN cliente cli ON ag.id_cli = cli.id
                 JOIN procedimento pro ON ag.id_pro = pro.id
                 WHERE ag.id_emp = $1`,
                [id]
            );
        } else {
            id = decodedToken.id;
            agendamento = await pool.query(
                `SELECT ag.*, emp.nome_fantasia AS empresa_nome, pro.nome AS procedimento_nome 
                 FROM agendamento ag
                 JOIN empreendedora emp ON ag.id_emp = emp.cnpj
                 JOIN procedimento pro ON ag.id_pro = pro.id
                 WHERE ag.id_cli = $1`,
                [id]
            );
        }

        if (agendamento.rows.length === 0) {
            return res.status(404).json({ error: 'Nenhum agendamento encontrado.' });
        }

        res.status(200).json(agendamento.rows);
    } catch (error) {
        console.error('Erro ao obter informações do agendamento:', error);
        res.status(500).json({ error: 'Erro ao obter informações do agendamento.' });
    }
});

router.get('/:cnpj', async (req, res) => {
    const { cnpj } = req.params;
    try {
        if (!cnpj || cnpj.length !== 14) {
            return res.status(400).json({ error: 'CNPJ inválido ou não fornecido.' });
        }

        const agendamento = await pool.query(
            `SELECT ag.*, cli.nome AS cliente_nome, pro.nome AS procedimento_nome
             FROM agendamento ag
             JOIN cliente cli ON ag.id_cli = cli.id
             JOIN procedimento pro ON ag.id_pro = pro.id
             WHERE ag.id_emp = $1`,
            [cnpj]
        );

        if (agendamento.rows.length === 0) {
            return res.status(404).json({ error: 'Nenhum agendamento encontrado para esta empresa.' });
        }

        res.status(200).json(agendamento.rows);
    } catch (error) {
        console.error('Erro ao obter informações do agendamento:', error);
        res.status(500).json({ error: 'Erro ao obter informações do agendamento.' });
    }
});

router.put('/', async (req, res) => {
    const { data, hora_inicio, hora_fim, id_emp, id_cli, id_pro } = req.body;

    if (!data || !hora_inicio || !hora_fim || !id_emp || !id_cli || !id_pro) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios: data, hora_inicio, hora_fim, id_emp, id_cli e id_pro.' });
    }

    try {
        const agendamentoExistente = await pool.query(
            'SELECT * FROM agendamento WHERE id_emp = $1 AND id_cli = $2',
            [id_emp, id_cli]
        );

        if (agendamentoExistente.rows.length === 0) {
            return res.status(404).json({ error: 'Agendamento não encontrado para os dados fornecidos.' });
        }

        const updateQuery = `
            UPDATE agendamento
            SET data = $1, hora_inicio = $2, hora_fim = $3, id_pro = $4
            WHERE id_emp = $5 AND id_cli = $6
        `;
        await pool.query(updateQuery, [data, hora_inicio, hora_fim, id_pro, id_emp, id_cli]);

        res.status(200).json({ message: 'Informações do agendamento atualizadas com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar agendamento:', error);
        res.status(500).json({ error: 'Erro ao atualizar informações do agendamento.' });
    }
});

router.delete('/', async (req, res) => {
    const { data, hora_inicio } = req.body;

    if (!data || !hora_inicio) {
        return res.status(400).json({ error: 'Os campos "data" e "hora_inicio" são obrigatórios.' });
    }

    try {
        const agendamentoExists = await pool.query(
            'SELECT * FROM agendamento WHERE data = $1 AND hora_inicio = $2',
            [data, hora_inicio]
        );

        if (agendamentoExists.rows.length === 0) {
            return res.status(404).json({ error: 'Agendamento não encontrado para a data e hora fornecidas.' });
        }

        await pool.query(
            'DELETE FROM agendamento WHERE data = $1 AND hora_inicio = $2',
            [data, hora_inicio]
        );

        res.status(200).json({ message: 'Agendamento deletado com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar agendamento:', error);
        res.status(500).json({ error: 'Erro ao deletar agendamento.' });
    }
});


const horarioDisponivel = agendamentosExistentes.rows.every(({ hora_inicio: inicioExistente, hora_fim: fimExistente }) => {
    const inicioNovo = new Date(`1970-01-01T${hora_inicio}:00`);
    const fimNovo = new Date(`1970-01-01T${hora_fim}:00`);
    const inicioExist = new Date(`1970-01-01T${inicioExistente}:00`);
    const fimExist = new Date(`1970-01-01T${fimExistente}:00`);
    
    // Garantir que a comparação entre horários não seja falha
    return (fimNovo <= inicioExist || inicioNovo >= fimExist); // Verifica se não há sobreposição
});


module.exports = router;