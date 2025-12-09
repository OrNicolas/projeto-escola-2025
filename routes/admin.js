const express = require('express');
const rotas = express.Router();
const bd = require('../db');


rotas.get('/login', (req, res) => {
    res.render('admin/login.ejs');
});

rotas.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    const sql = 'SELECT * FROM usuario WHERE email = $1 AND senha = $2';
    try {
        const dados = await bd.query(sql, [email.trim(), senha.trim()]);

        if (dados.rows.length == 0) {
            return res.render('admin/login.ejs', { mensagem: 'Email ou senha incorretos' });
        } else {
            req.session.usuario = dados.rows[0];
            return res.redirect('/admin/dashboard');
        }
    } catch (error) {
        console.error("Erro ao processar login/consulta ao BD:", error);
        return res.render('admin/login.ejs', { mensagem: 'Ocorreu um erro no servidor. Tente novamente.' });
    }
});

rotas.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// A Rota raiz /admin deve redirecionar para o dashboard
rotas.get('/', (req, res) => {
    res.redirect('/admin/dashboard');
});


rotas.get('/dashboard', async (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/admin/login');
    }

    try {
        const qMov = await bd.query(`SELECT COUNT(*) as total_mov FROM movimentacaoestoque;`)
        const qProdutos = await bd.query('SELECT COUNT(*) as total_produtos FROM produto WHERE ativo = true');
        const qUsuarios = await bd.query('SELECT COUNT(*) as total_usuarios FROM usuario WHERE ativo = true');
        const qCategorias = await bd.query('SELECT COUNT(*) as total_categorias FROM categoria WHERE ativo = true');

        const qMediaEstoquePorCategoria = await bd.query(
            `SELECT c.nome, AVG(p.quantidade_estoque) as media_estoque FROM categoria c INNER JOIN produto p ON c.id_categoria = p.id_categoria GROUP BY c.nome`
        );
        const qTotalMovimentacoesPorTipo = await bd.query(
            `SELECT tipo, COUNT(*) as total FROM movimentacaoestoque WHERE tipo IS NOT NULL GROUP BY tipo`
        );
        const qProdutosBaixoEstoque = await bd.query(
            `SELECT p.nome, p.quantidade_estoque, p.estoque_minimo, c.nome as nome_categoria FROM produto p INNER JOIN categoria c ON p.id_categoria = c.id_categoria WHERE p.quantidade_estoque < p.estoque_minimo ORDER BY p.nome`
        );

        res.render('admin/dashboard', {
            titulo: 'Dashboard - BatPapel',
            usuario: req.session.usuario, // Passa o usuário logado
            totalProdutos: qProdutos.rows[0].total_produtos,
            totalUsuarios: qUsuarios.rows[0].total_usuarios,
            totalCategorias: qCategorias.rows[0].total_categorias,
            mediaEstoquePorCategoria: qMediaEstoquePorCategoria.rows,
            totalMovimentacoesPorTipo: qTotalMovimentacoesPorTipo.rows,
            produtosBaixoEstoque: qProdutosBaixoEstoque.rows,
            qMov:qMov.rows[0].total_mov
        });

    } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        res.status(500).send('Erro interno do servidor ao carregar dashboard.');
    }
});


module.exports = rotas;