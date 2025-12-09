
// Configurações Iniciais
const express = require('express');
const rotas = express.Router();
const bd = require('../db');

// Criar Relatório (POST)
rotas.post('/relatorios/listar', async (req, res) => {
    const { titulo, data, conteudo } = req.body;

    try {
        const sql = `
            INSERT INTO relatorio (titulo, data_emissao, conteudo, id_usuario) 
            VALUES ($1, $2, $3, $4) RETURNING *;
        `;

        // ID do usuário logado
        const idUsuario = req.session.usuario ? req.session.usuario.id : 1;

        await bd.query(sql, [titulo, data, conteudo, idUsuario]);

        res.redirect('/admin/relatorios');

    } catch (error) {
        console.error('Erro ao salvar novo relatório:', error);
        res.status(500).send('Erro interno ao tentar salvar o relatório.');
    }
});

// Listar Relatórios (GET)
rotas.get('/relatorios/listar', async (req, res) => {
    try {
        const qRelatorios = await bd.query(`
            SELECT * FROM relatorio 
            ORDER BY data_emissao DESC
        `);

        res.render('admin/relatorios/listar', {
            titulo: 'Lista de Relatórios',
            listaRelatorios: qRelatorios.rows
        });

    } catch (error) {
        console.error('Erro ao buscar lista de relatórios:', error);
        res.status(500).send('Erro interno ao carregar a lista.');
    }
});

// Exportação das Rotas
module.exports = rotas;
