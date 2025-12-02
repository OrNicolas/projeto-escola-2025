const express = require('express');
const rotas = express.Router();
const bd = require('../db');


// LISTAR USUÁRIOS
rotas.get('/listar', async (req, res) => {
    try {
        const ordem = req.query.ordem || 'id_usuario';
        const busca = req.query.busca || '';
        const ativo = req.query.ativo ?? true;

        const sql = `
            SELECT * 
            FROM usuario 
            WHERE nome ILIKE $1 
            AND ativo = $2
            ORDER BY ${ordem}
        `;

        const dados = await bd.query(sql, [`%${busca}%`, ativo]);

        res.render('usuarios/listar.ejs', { usuarios: dados.rows });
    } catch (erro) {
        console.error('Erro ao buscar usuários:', erro);
        res.status(500).send('Erro ao buscar usuários');
    }
});


// FORMULÁRIO PARA NOVO USUÁRIO
rotas.get('/novo', async (req, res) => {
    res.render('usuarios/novo.ejs');
});


// SALVAR NOVO USUÁRIO
// routes/usuarios.js

// SALVAR NOVO USUÁRIO
rotas.post('/novo', async (req, res) => {
    const { nome, email, senha, tipo_usuario, ativo } = req.body;
    const statusAtivo = (ativo === 'TRUE'); 

    try {
        const sql = `
            INSERT INTO usuario (nome, email, senha, tipo_usuario, ativo) 
            VALUES ($1, $2, $3, $4, $5);
        `;
        const valores = [nome, email, senha, tipo_usuario, statusAtivo];
        await bd.query(sql, valores);
        res.redirect('/usuarios/listar'); 
    } catch (error) {
        console.error('Erro ao inserir novo usuário:', error);
        res.status(500).send(`Erro ao inserir novo usuário. Detalhe: ${error.message}`);
    }
});


// EDITAR USUÁRIO (FORMULÁRIO)
rotas.get('/editar/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const sql = 'SELECT * FROM usuario WHERE id_usuario = $1';
        const dados = await bd.query(sql, [id]);

        res.render('usuarios/editar.ejs', { usuario: dados.rows[0] });
    } catch (erro) {
        console.error("Erro ao buscar usuário:", erro);
        res.status(500).send("Erro ao buscar usuário");
    }
});


// SALVAR EDIÇÃO
rotas.post('/editar/:id', async (req, res) => {
    const id = req.params.id;
    const { nome, email, tipo_usuario, senha, ativo } = req.body;

    try {
        const sql = `
            UPDATE usuario
            SET nome = $1, email = $2, tipo_usuario = $3, senha = $4, ativo = $5
            WHERE id_usuario = $6
        `;

        await bd.query(sql, [nome, email, tipo_usuario, senha, ativo, id]);

        res.redirect('/usuarios/listar');
    } catch (erro) {
        console.error("Erro ao atualizar usuário:", erro);
        res.status(500).send(`Erro ao atualizar usuário . Erro: ${erro.message}`);
    }
});


module.exports = rotas;
