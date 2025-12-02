const express = require('express');
const rotas = express.Router();
const bd = require('../db');

rotas.get('/listar', async (req, res) => {
    try {
        const ordem = req.query.ordem || 'id_produto';
        const busca = req.query.busca || '';
        const ativo = req.query.ativo || true;
        const dados = await bd.query('select * from produto where nome ilike $1 and ativo = $2 order by $3', ['%' + busca + '%', ativo, ordem]);
        console.log(dados);
        
        res.render('produtos/listar.ejs', { produtos: dados.rows });
    }
    catch (erro) {
        console.error('Erro ao buscar produtos:', erro);
        res.status(500).send('Erro ao buscar produtos');
    }
})

rotas.get('/novo', async(req,res) =>{
    const dados = await bd.query('SELECT * from categoria where ativo  = true')
    const dadosProd = await bd.query('SELECT * from produto where ativo  = true')

    res.render('produtos/novo.ejs', {categorias: dados.rows, produto: dadosProd.rows})
});
rotas.post('/novo', async(req,res) =>{
    const nome = req.body.nome
    const preco = req.body.preco
    const foto = req.body.foto
    const quantidade_estoque = req.body.quantidade_estoque
    const estoque_minimo = req.body.estoque_minimo
    const id_categoria = req.body.id_categoria
    if (!nome) {
        return res.status(400).send("O campo Nome é obrigatório.");
    }
    const sql = `Insert into produto (nome, preco, foto, quantidade_estoque, estoque_minimo, id_categoria)
        VALUES ($1, $2, $3, $4, $5, $6)`
    await bd.query(sql, [nome, preco, foto, quantidade_estoque, estoque_minimo, id_categoria])

    res.redirect('/produtos/listar')
});

rotas.get('/editar/:id', async(req,res) =>{
    const id = req.params.id;
    const sql = 'SELECT * FROM produto WHERE id_produto = $1'
    const dados = await bd.query(sql, [id]);
    const sqlCAT= "select * from categoria where ativo = true order by id_categoria"
    const dadosCAT = await bd.query(sqlCAT)
    res.render('produtos/editar.ejs', {produto: dados.rows[0], categorias:dadosCAT.rows});
});

rotas.post('/editar/:id', async(req,res) => {
    // 1. Obter o ID do produto a ser editado
    const id = req.params.id
    
    // 2. Obter os novos dados do produto do corpo da requisição (req.body)
    const nome = req.body.nome
    const preco = req.body.preco
    const quantidade_estoque = req.body.quantidade_estoque
    const estoque_minimo = req.body.estoque_minimo
    const ativo = req.body.ativo // Virá como 'TRUE' ou 'FALSE' (string)
    const id_categoria = req.body.id_categoria
    const foto = req.body.foto
    
    // CORREÇÃO: Usar 'bd' (minúsculo) para a conexão e ajustar a query SQL.
    const sql = `UPDATE produto 
                 SET nome=$1, preco=$2, quantidade_estoque=$3, estoque_minimo=$4, 
                     ativo=$5, id_categoria=$6, foto=$7 
                 WHERE id_produto=$8`
                 
    // O array de valores DEVE seguir a ordem dos placeholders na query ($1, $2, ...)
    const valores = [
        nome, 
        preco, 
        quantidade_estoque, 
        estoque_minimo, 
        ativo, 
        id_categoria, 
        foto, 
        id
    ]

    await bd.query(sql, valores)
    
    // Redireciona para a listagem de produtos
    res.redirect('/produtos/listar') 
})

rotas.post('/excluir/:id', async (req, res) => {
    const id = req.params.id;
    // Melhor forma pratica é desativar o item, não excluir
    const sql = `UPDATE produto set ativo = false where id_produto = $1`;
    await bd.query(sql, [id])
    res.redirect('/produtos/listar');
})



module.exports = rotas;