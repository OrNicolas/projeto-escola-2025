const express = require('express');
const rotas = express.Router();
const bd = require('../db');

rotas.get('/listar', async (req, res) => {
    try {
        const ordem = req.query.ordem || 'id_categoria';
        const busca = req.query.busca || '';
        const ativo = req.query.ativo;
        const dados = await bd.query(`select * from categoria where nome ilike ${"'%" + busca + "%'"} ${ativo ? 'and ativo = true' : ''} order by ${ordem}`);
        console.log(dados);
        res.render('categorias/listar.ejs', { categoria: dados.rows });
    }
    catch (erro) {
        console.error('Erro ao buscar produtos:', erro);
        res.status(500).send('Erro ao buscar categorias');
    }
})


// Assumindo que você está usando o express.Router e a conexão com o banco (bd)
// const bd = require('./db/conexao'); // Exemplo: inclua a sua conexão aqui

// Rota GET: Mostra o formulário de edição
rotas.get('/editar/:id', async (req, res) => {
    // 1. Obtém o ID da URL
    const id = req.params.id;
    
    // 2. Query SQL CORRIGIDA: Buscar da tabela 'categoria' pelo 'id_categoria'
    const sql = 'SELECT * FROM categoria WHERE id_categoria = $1';
    
    // 3. Executa a query
    const dados = await bd.query(sql, [id]);

    // 4. CORREÇÃO: Pega o primeiro registro (a categoria) do array 'rows'
    const categoria = dados.rows[0]; 

    // 5. Renderiza a view 'categorias/editar.ejs' e passa o objeto 'categoria'
    // Se não encontrar, você pode adicionar um tratamento de erro (ex: 404)
    if (categoria) {
        res.render('categorias/editar.ejs', { categoria: categoria });
    } else {
        res.status(404).send('Categoria não encontrada!');
    }
});


rotas.get('/novo', async(req,res) =>{
    const dadosCategorias = await bd.query('SELECT * from categoria where ativo = true');
    
    // Você não precisa de dados de produto para criar uma nova categoria, 
    // então a consulta 'dadosProd' foi removida para otimização.

    // Renderiza o template do formulário de Nova Categoria.
    // ⚠️ Ajuste o caminho 'admin/categorias-novo.ejs' se o seu arquivo estiver em outro lugar.
    res.render('categorias/novo.ejs', { categorias: dadosCategorias.rows });
});

rotas.post('/novo', async(req,res) =>{
    const nome = req.body.nome;
    const ativo = true; 
    if (!nome) {
        return res.status(400).send("O campo Nome da Categoria é obrigatório.");
    }
    
    const sql = `
        INSERT INTO categoria (nome, ativo)
        VALUES ($1, $2)
    `;
    
    // Executa a inserção
    await bd.query(sql, [nome, ativo]);

    // Redireciona para a página de listagem de categorias
    res.redirect('/categorias/listar');
});











// Rota POST: Processa a submissão do formulário e salva no DB
rotas.post('/editar/:id', async (req, res) => {
    // 1. Obter o ID da categoria a ser editada
    const id = req.params.id;
    
    // 2. Obter os novos dados do corpo da requisição
    const nome = req.body.nome;
    // O valor virá como a string 'TRUE' ou 'FALSE' do formulário
    const ativo = req.body.ativo; 
    
    // 3. Query SQL para UPDATE (apenas nome e ativo)
    const sql = `UPDATE categoria 
                 SET nome=$1, ativo=$2
                 WHERE id_categoria=$3`;
                 
    // O array de valores DEVE seguir a ordem dos placeholders na query ($1, $2, ...)
    const valores = [
        nome, 
        ativo, 
        id
    ];

    await bd.query(sql, valores);
    
    // 4. Redireciona para a listagem de categorias
    res.redirect('/categorias/listar'); 
});



rotas.post('/excluir/:id', async (req, res) => {
    const id = req.params.id;
    // Melhor forma pratica é desativar o item, não excluir
    const sql = `UPDATE categoria set ativo = false where id_categoria = $1`;
    await bd.query(sql, [id])
    res.redirect('/categorias/listar');
})
// module.exports = rotas; // Inclua esta linha no seu arquivo de rotas


module.exports = rotas;