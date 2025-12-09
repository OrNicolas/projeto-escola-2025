const express = require('express');
const rotas = express.Router();
const bd = require('../db');

rotas.get('/', async (req, res) => {
    try {
        const colunasPermitidas = ['nome', 'quantidade_estoque', 'preco', 'id_produto'];
        
        let ordem = req.query.ordem || 'nome';
        if (!colunasPermitidas.includes(ordem.toLowerCase())) {
            console.warn(`Tentativa de ordenação inválida: ${ordem}. Usando 'nome'.`);
            ordem = 'nome'; 
        }

        const busca = req.query.busca || '';
        const ativoQueryParam = req.query.ativo || 'true'; 

        const sql = `
            SELECT * FROM produto 
            WHERE nome ILIKE $1 AND ativo = $2
            ORDER BY ${ordem}
        `;
        
        const dados = await bd.query(sql, ['%' + busca + '%', ativoQueryParam]);
        
        console.log(`Buscando ${dados.rows.length} produtos. Ordenado por: ${ordem}`);
        
        res.render('landing/index', { 
            produtos: dados.rows, 
            titulo: 'Papelaria BatPapel', 
            query: req.query 
        });
    }
    catch (erro) {
        console.error('Erro ao buscar produtos:', erro);
        res.status(500).send('Erro ao buscar produtos');
    }
});

rotas.get('/sobre', (req, res) => {
    try {
        res.render('landing/sobre', { 
            titulo: 'Sobre a BatPapel'
        });
    }
    catch (erro) {
        console.error('Erro ao carregar página Sobre:', erro);
        res.status(500).send('Erro ao carregar a página.');
    }
});

module.exports = rotas;