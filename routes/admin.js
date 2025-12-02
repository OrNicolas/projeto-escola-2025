const express = require('express');
const rotas = express.Router();
const bd = require('../db');


rotas.get('/login', (req, res) => {
    res.render('admin/login.ejs');
});

rotas.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    // Atenção: Em produção, NUNCA armazene senhas como texto puro. Use hashing (ex: bcrypt).
    // CORREÇÃO: Aplicar trim() para remover espaços em branco no início/fim
    const sql = 'SELECT * FROM usuario WHERE email = $1 AND senha = $2';
    // Use trim() nas variáveis para garantir que não há espaços indesejados
    const dados = await bd.query(sql, [email.trim(), senha.trim()]); 

    if (dados.rows.length == 0) {
        // Renderiza a tela de login com uma mensagem de erro
        res.render('admin/login.ejs', { mensagem: 'Email ou senha incorretos' });
    } else {
        // Sucesso no login
        req.session.usuario = dados.rows[0];
        res.redirect('/admin/dashboard'); // Redireciona para o dashboard correto
    }
});

rotas.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// A Rota raiz /admin deve redirecionar para o dashboard
rotas.get('/', (req, res) => {
    res.redirect('/admin/dashboard'); 
});


rotas.get('/dashboard', async (req, res) => {
    // ⚠️ PASSO 1: Verificação de Autenticação
    if (!req.session.usuario) {
        return res.redirect('/admin/login');
    }

    try {
        // ⚠️ PASSO 2: Consultas ao Banco de Dados
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
        });

    } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        res.status(500).send('Erro interno do servidor ao carregar dashboard.');
    }
});


module.exports = rotas;