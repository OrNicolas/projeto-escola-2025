const express = require('express');
const rotas = express.Router();
const bd = require('../db');

// Rota para a listagem principal (que será acessada via app.get('/'))
rotas.get('/', async (req, res) => {
    try {
        // 1. Crie uma lista branca das colunas que podem ser usadas para ORDER BY
        const colunasPermitidas = ['nome', 'quantidade_estoque', 'preco', 'id_produto'];
        
        // 2. Validação da ordenação
        let ordem = req.query.ordem || 'nome';
        if (!colunasPermitidas.includes(ordem.toLowerCase())) {
            console.warn(`Tentativa de ordenação inválida: ${ordem}. Usando 'nome'.`);
            ordem = 'nome'; 
        }

        const busca = req.query.busca || '';
        const ativoQueryParam = req.query.ativo || 'true'; 
        // Passamos a string 'true' ou 'false' para o $2, e o PostgreSQL lida com a conversão.

        // 3. Montagem da Query SQL (Usando interpolação SOMENTE para ORDER BY)
        const sql = `
            SELECT * FROM produto 
            WHERE nome ILIKE $1 AND ativo = $2
            ORDER BY ${ordem}
        `;
        
        // 4. Execução da Query (Passando busca e ativo como parâmetros parametrizados $1 e $2)
        const dados = await bd.query(sql, ['%' + busca + '%', ativoQueryParam]);
        
        console.log(`Buscando ${dados.rows.length} produtos. Ordenado por: ${ordem}`);
        
        res.render('landing/index', { 
            produtos: dados.rows, 
            titulo: 'Papelaria BatPapel', 
            query: req.query 
        });
    }
    catch (erro) {
        // Se o erro for na query, ele será capturado aqui.
        console.error('Erro ao buscar produtos:', erro);
        res.status(500).send('Erro ao buscar produtos');
    }
});

module.exports = rotas;