const express = require('express');
const rotas = express.Router();
const bd = require('../db');

rotas.post('/relatorios/listar', async (req, res) => {
  const { titulo, data, conteudo } = req.body;

    try {
        const sql = `
            INSERT INTO relatorio (titulo, data_emissao, conteudo, id_usuario) 
            VALUES ($1, $2, $3, $4) RETURNING *;
        `;
        const idUsuario = req.session.usuario ? req.session.usuario.id : 1; // Fallback para ID 1 se não houver sessão
        
        await bd.query(sql, [titulo, data, conteudo, idUsuario]);
        res.redirect('/admin/relatorios'); 

    } catch (error) {
        console.error('Erro ao salvar novo relatório:', error);
        res.status(500).send('Erro interno ao tentar salvar o relatório.');
    }
});

rotas.get('/relatorios/listar', async (req, res) => {
    try {
        const qRelatorios = await bd.query('SELECT * FROM relatorio ORDER BY data_emissao DESC');
        
        // Renderiza a view 'listar.ejs'
        res.render('admin/relatorios/listar', {
            titulo: 'Lista de Relatórios',
            listaRelatorios: qRelatorios.rows 
        });
    } catch (error) {
        console.error('Erro ao buscar lista de relatórios:', error);
        res.status(500).send('Erro interno ao carregar a lista.');
    }
});

module.exports = rotas;