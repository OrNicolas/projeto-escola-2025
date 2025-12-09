// 🔹 Imports e Configurações
const express = require('express');
const rotas = express.Router();
const bd = require('../db');


// 🔹 ROTA GET - LISTAR PRODUTOS
rotas.get('/listar', async (req, res) => {
    try {
        // 🔸 Parâmetros de busca
        const busca = req.query.busca || '';
        const ordem = req.query.ordem || 'id_produto';
        const ativo = req.query.ativo || '';
        const pg = Number(req.query.pg) || 1;

        // 🔸 Paginação
        const limite = 4;
        const offset = (pg - 1) * limite;

        // 🔸 SQL de Listagem
        const sql = `
            SELECT *,
                COUNT(*) OVER() AS total_itens
            FROM produto
            WHERE nome ILIKE $1
            ${ativo !== '' ? "AND ativo = $4" : ""}
            ORDER BY ${ordem}
            LIMIT $2 OFFSET $3
        `;

        // 🔸 Parâmetros para o SQL
        const params = [`%${busca}%`, limite, offset];
        if (ativo !== '') params.push(ativo);

        const dados = await bd.query(sql, params);

        const totalItens = dados.rows.length > 0 ? dados.rows[0].total_itens : 0;
        const totalPgs = Math.ceil(totalItens / limite);

        res.render('produtos/listar.ejs', {
            produtos: dados.rows,
            totalPgs,
            pgAtual: pg,
            busca,
            ordem,
            ativo
        });

    } catch (erro) {
        console.error('Erro ao buscar produtos:', erro);
        res.status(500).render('erro', { mensagem: 'Erro interno ao buscar produtos.' });
    }
});


// 🔹 ROTA GET - NOVO PRODUTO (Formulário)
rotas.get('/novo', async (req, res) => {
    const dadosCAT = await bd.query('SELECT * FROM categoria WHERE ativo = true ORDER BY nome');
    res.render('produtos/novo.ejs', { categorias: dadosCAT.rows });
});


// 🔹 ROTA POST - CADASTRAR NOVO PRODUTO
rotas.post('/novo', async (req, res) => {

    // 🔸 Campos recebidos
    const { nome, descricao, preco, foto, quantidade_entrada, estoque_minimo, id_categoria } = req.body;

    if (!nome || !preco || !quantidade_entrada || !id_categoria) {
        return res.status(400).send("Campos obrigatórios ausentes.");
    }

    const client = await bd.connect();

    try {
        await client.query('BEGIN');

        // 🔸 Inserir produto
        const sqlProduto = `
            INSERT INTO produto (nome, descricao, preco, foto, quantidade_estoque, estoque_minimo, id_categoria)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id_produto;
        `;
        const valoresProduto = [
            nome,
            descricao || '',
            parseFloat(preco),
            foto || '',
            parseInt(quantidade_entrada),
            parseInt(estoque_minimo),
            parseInt(id_categoria)
        ];

        const resultadoProduto = await client.query(sqlProduto, valoresProduto);
        const novoProdutoId = resultadoProduto.rows[0].id_produto;

        // 🔸 Registrar movimentação inicial
        const idUsuario = req.session.usuario ? req.session.usuario.id_usuario : 1;
        // O valor 'entrada' é usado para o campo 'tipo' na tabela de movimentação
        const tipoDB = 'entrada'; 

        const sqlMovimentacao = `
    INSERT INTO movimentacaoestoque (id_produto, tipo, quantidade, id_usuario, data_movimentacao)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP);
`;
        await client.query(sqlMovimentacao, [
            novoProdutoId,
            tipoDB,
            parseInt(quantidade_entrada),
            idUsuario
        ]);

        await client.query('COMMIT');
        res.redirect('/produtos/listar?msg=Produto cadastrado com sucesso.');

    } catch (erro) {
        await client.query('ROLLBACK');
        console.error('Erro ao cadastrar produto:', erro);
        res.status(500).render('erro', { mensagem: 'Erro ao salvar produto.' });
    } finally {
        client.release();
    }
});


// 🔹 ROTA GET - EDITAR PRODUTO (Formulário)
rotas.get('/editar/:id', async (req, res) => {

    const id = req.params.id;

    const produtoQuery = 'SELECT * FROM produto WHERE id_produto = $1';
    const categoriaQuery = 'SELECT * FROM categoria WHERE ativo = true ORDER BY nome';

    const dados = await bd.query(produtoQuery, [id]);
    const categorias = await bd.query(categoriaQuery);

    if (dados.rows.length === 0) {
        return res.redirect('/produtos/listar?erro=Produto não encontrado');
    }

    res.render('produtos/editar.ejs', {
        produto: dados.rows[0],
        categorias: categorias.rows
    });
});


// 🔹 ROTA POST - EDITAR PRODUTO
rotas.post('/editar/:id', async (req, res) => {

    const id = req.params.id;

    const {
        nome,
        preco,
        estoque_minimo,
        ativo,
        id_categoria,
        foto,
        descricao
    } = req.body;

    const sql = `
        UPDATE produto 
        SET nome=$1, preco=$2, estoque_minimo=$3,
            ativo=$4, id_categoria=$5, foto=$6, descricao=$7
        WHERE id_produto=$8
    `;

    try {
        await bd.query(sql, [
            nome,
            parseFloat(preco),
            parseInt(estoque_minimo),
            ativo === 'true',
            parseInt(id_categoria),
            foto || '',
            descricao || '',
            id
        ]);

        res.redirect('/produtos/listar');

    } catch (erro) {
        console.error('Erro ao editar produto:', erro);
        res.status(500).render('erro', { mensagem: 'Falha ao atualizar o produto.' });
    }
});

// 🔹 ROTA POST - EXCLUIR PRODUTO (Soft Delete)
rotas.post('/excluir/:id', async (req, res) => {
    try {
        await bd.query('UPDATE produto SET ativo = FALSE WHERE id_produto = $1', [req.params.id]);
        res.redirect('/produtos/listar');
    } catch (erro) {
        console.error('Erro ao desativar:', erro);
        res.status(500).render('erro', { mensagem: 'Falha ao desativar o produto.' });
    }
});


// 🔹 ROTA GET - HISTÓRICO DE MOVIMENTAÇÕES
rotas.get('/:id_produto/movimentacoes', async (req, res) => {
    const id_produto = req.params.id_produto;

    // 🔸 Parâmetros de Paginação
    const pg = Number(req.query.page) || 1; // 'page' é o nome do parâmetro na URL (ex: ?page=2)
    const limite = 5; // Definindo 10 itens por página para o histórico
    const offset = (pg - 1) * limite;

    try {
        // 🔸 Dados do produto
        const produtoQuery = await bd.query(
            'SELECT id_produto, nome, quantidade_estoque FROM produto WHERE id_produto = $1',
            [id_produto]
        );

        if (produtoQuery.rows.length === 0) {
            return res.status(404).render('erro', { mensagem: 'Produto não encontrado.' });
        }
        const produto = produtoQuery.rows[0];

        // 🔸 1. Buscar o TOTAL de Movimentações
        const totalItensQuery = await bd.query(
            'SELECT COUNT(*) FROM movimentacaoestoque WHERE id_produto = $1',
            [id_produto]
        );
        const totalItens = parseInt(totalItensQuery.rows[0].count, 10);
        const totalPgs = Math.ceil(totalItens / limite);

        // 🔸 2. Buscar Movimentações da Página Atual (com LIMIT e OFFSET)
        const historico = await bd.query(`
            SELECT m.data_movimentacao, m.tipo, m.quantidade, u.nome AS usuario_nome
            FROM movimentacaoestoque m
            JOIN usuario u ON m.id_usuario = u.id_usuario
            WHERE m.id_produto = $1
            ORDER BY m.data_movimentacao DESC
            LIMIT $2 OFFSET $3
        `, [id_produto, limite, offset]);

        res.render('produtos/historico_movimentacoes.ejs', {
            produto,
            movimentacoes: historico.rows,
            mensagem: req.query.msg || null,
            // NOVAS VARIÁVEIS DE PAGINAÇÃO
            pgAtual: pg,
            totalPgs,
            limite // Útil se quiser mostrar a contagem de itens
        });

    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        res.status(500).render('erro', { mensagem: 'Erro ao carregar movimentações.' });
    }
});


rotas.post('/movimentar', async (req, res) => {

    const { id_produto, tipo_movimentacao, quantidade } = req.body;
    const id_usuario = req.session.usuario?.id_usuario || 1;

    const tipo = tipo_movimentacao;
    const qtd = parseInt(quantidade);

    if (!id_produto || !tipo || !qtd || qtd <= 0 || !['ENTRADA', 'SAIDA'].includes(tipo)) {
        return res.redirect(`/produtos/${id_produto}/movimentacoes?msg=Dados inválidos`);
    }

    const tipoDB = tipo.toLowerCase();

    const client = await bd.connect();

    try {
        await client.query('BEGIN');

        let updateQuery;

        if (tipo === 'ENTRADA') {
            updateQuery = `
                UPDATE produto SET quantidade_estoque = quantidade_estoque + $1
                WHERE id_produto = $2 RETURNING quantidade_estoque
            `;
        } else {
            const estoqueAtual = await client.query(
                'SELECT quantidade_estoque FROM produto WHERE id_produto=$1',
                [id_produto]
            );

            if (estoqueAtual.rows.length === 0 || estoqueAtual.rows[0].quantidade_estoque < qtd) {
                await client.query('ROLLBACK');
                return res.redirect(`/produtos/${id_produto}/movimentacoes?msg=Estoque insuficiente`);
            }

            updateQuery = `
                UPDATE produto SET quantidade_estoque = quantidade_estoque - $1
                WHERE id_produto = $2 RETURNING quantidade_estoque
            `;
        }

        const novoEstoque = await client.query(updateQuery, [qtd, id_produto]);

        await client.query(`
            INSERT INTO movimentacaoestoque (id_produto, tipo, quantidade, id_usuario, data_movimentacao)
            VALUES ($1, $2, $3, $4, NOW())
        `, [id_produto, tipoDB, qtd, id_usuario]);

        await client.query('COMMIT');

        res.redirect(`/produtos/${id_produto}/movimentacoes?msg=Movimentação registrada com sucesso`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro na movimentação:', error);
        res.redirect(`/produtos/${id_produto}/movimentacoes?msg=Erro interno`);
    } finally {
        client.release();
    }
});

// 🔹 Exportar Rotas
module.exports = rotas;