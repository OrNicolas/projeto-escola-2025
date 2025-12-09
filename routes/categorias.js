// 🔧 Importa Express e inicializa o Router para criar rotas separadas
const express = require('express');

// 🔧 Cria um agrupamento de rotas exclusivo para categorias
const rotas = express.Router();

// 🔧 Conexão com o banco de dados (PostgreSQL)
const bd = require('../db');



/* 📌 ROTA: GET /listar
   ▶ Lista categorias com busca, filtro, ordenação e paginação*/
rotas.get('/listar', async (req, res) => {
    try {

        // 📌 Parâmetro de busca por nome
        const busca = req.query.busca || '';

        // 📌 Campo de ordenação (padrão: id_categoria)
        const ordem = req.query.ordem || 'id_categoria';

        // 📌 Filtro por ativo/inativo
        const ativo = req.query.ativo || '';

        // 📌 Página atual (para paginação)
        const pg = Number(req.query.pg) || 1;

        // 📌 Limite de itens por página
        const limite = 4;

        // 📌 Offset calculado para pular registros
        const offset = (pg - 1) * limite;

        // 📌 Query SQL que lista com COUNT total
        const sql = `
            SELECT *,
                   COUNT(*) OVER() AS total_itens
            FROM categoria
            WHERE nome ILIKE $1
            ${ativo !== '' ? "AND ativo = $4" : ""}
            ORDER BY ${ordem}
            LIMIT $2 OFFSET $3
        `;

        // 📌 Parâmetros da Query
        const params = [`%${busca}%`, limite, offset];
        if (ativo !== '') params.push(ativo);

        // 📌 Executa a consulta
        const dados = await bd.query(sql, params);

        // 📌 Descobre quantidade total de itens
        const totalItens = dados.rows.length > 0 ? dados.rows[0].total_itens : 0;

        // 📌 Calcula número total de páginas
        const totalPgs = Math.ceil(totalItens / limite);

        // 📌 Renderiza página de listagem
        res.render('categorias/listar.ejs', {
            categoria: dados.rows,
            totalPgs,
            pgAtual: pg,
            busca,
            ordem,
            ativo
        });

    } catch (erro) {
        console.error('Erro ao buscar categorias:', erro);
        res.status(500).send('Erro ao buscar categorias');
    }
});



/* 📌 ROTA: GET /editar/:id
   ▶ Busca uma categoria pelo ID e envia para edição */
rotas.get('/editar/:id', async (req, res) => {

    // 📌 ID da categoria vindo da URL
    const id = req.params.id;

    // 📌 Query SQL que pega 1 categoria
    const sql = 'SELECT * FROM categoria WHERE id_categoria = $1';

    // 📌 Executa consulta
    const dados = await bd.query(sql, [id]);

    const categoria = dados.rows[0]; 

    if (categoria) {
        res.render('categorias/editar.ejs', { categoria });
    } else {
        res.status(404).send('Categoria não encontrada!');
    }
});



/* 📌 ROTA: GET /novo
   ▶ Exibe formulário para criar uma nova categoria */
rotas.get('/novo', async(req,res) =>{

    // 📌 Busca categorias ativas (caso queira relacionamentos)
    const dadosCategorias = await bd.query('SELECT * from categoria where ativo = true');

    // 📌 Renderiza a página de criação
    res.render('categorias/novo.ejs', { categorias: dadosCategorias.rows });
});



/* 📌 ROTA: POST /novo
   ▶ Salva uma nova categoria no banco de dados */
rotas.post('/novo', async(req,res) =>{

    // 📌 Nome enviado pelo formulário
    const nome = req.body.nome;

    // 📌 Categoria nova sempre ativa inicialmente
    const ativo = true; 

    // 📌 Validação simples
    if (!nome) {
        return res.status(400).send("O campo Nome da Categoria é obrigatório.");
    }

    // 📌 Query de inserção
    const sql = `
        INSERT INTO categoria (nome, ativo)
        VALUES ($1, $2)
    `;
    
    await bd.query(sql, [nome, ativo]);

    res.redirect('/categorias/listar');
});



/* 📌 ROTA: POST /editar/:id
   ▶ Atualiza uma categoria existente */
rotas.post('/editar/:id', async (req, res) => {

    // 📌 ID da categoria sendo atualizada
    const id = req.params.id;

    // 📌 Dados enviados pelo formulário
    const nome = req.body.nome;
    const ativo = req.body.ativo;  // TRUE / FALSE

    // 📌 Query SQL de atualização
    const sql = `UPDATE categoria 
                 SET nome=$1, ativo=$2
                 WHERE id_categoria=$3`;
                 
    const valores = [nome, ativo, id];

    await bd.query(sql, valores);
    
    res.redirect('/categorias/listar'); 
});



/* 📌 ROTA: POST /excluir/:id
   ▶ Desativa uma categoria ao invés de excluir do banco */
rotas.post('/excluir/:id', async (req, res) => {

    // 📌 ID a ser desativado
    const id = req.params.id;

    // 📌 Atualiza campo "ativo" para false
    const sql = `UPDATE categoria SET ativo = false WHERE id_categoria = $1`;

    await bd.query(sql, [id]);
    
    res.redirect('/categorias/listar');
});

/* 📌 Exporta este agrupamento de rotas */
module.exports = rotas;

