require('dotenv').config();
const { Pool } = require('pg');


// const bd = new Pool(
//     {
//         user: 'postgres', //Usuario cadastrado no banco de dados
//         host: 'localhost', //Servidor do banco de dados
//         database: 'projeto_2025', //Nome do banco de dados
//         password: 'admin', //Senha do banco de dados
//         port: 5432, //Porta padrao do postgresql
//     }
// );

const bd = new Pool(
    {
        connectionString: "postgres://postgres.elcxgpnbbcrllvbryzzs:QDyFv2nWMuNMW4pq@aws-1-sa-east-1.pooler.supabase.com:5432/postgres", 
        max: 20
    }
);

// const pool = new Pool({
//     // ⚠️ CONFIRME QUE ESTES VALORES SÃO IDÊNTICOS AOS DO SEU BANCO DE DADOS ⚠️
//     user: process.env.DB_USER,        // Usuário correto
//     host: process.env.DB_HOST,        // Deve ser 'localhost' ou '127.0.0.1' para desenvolvimento local
//     database: process.env.DB_DATABASE, // Nome do DB existe e está correto
//     password: process.env.DB_PASSWORD, // Senha correta (você já corrigiu o problema de string aqui)
//     port: process.env.DB_PORT || 5432, 
// });

        const dataAtual = new Date();

        const dia = dataAtual.getDate(); // Dia do mês (1-31)
        const mes = dataAtual.getMonth() + 1; // Mês (0-11, por isso +1)
        const ano = dataAtual.getFullYear(); // Ano (YYYY)

        const diaFormatado = String(dia).padStart(2, '0'); // Garante 2 dígitos (ex: 05)
        const mesFormatado = String(mes).padStart(2, '0'); // Garante 2 dígitos (ex: 09)
        const hora = dataAtual.getHours();
        const minutos = dataAtual.getMinutes();
        const segundos = dataAtual.getSeconds();
        console.log(`${hora}:${minutos}:${segundos}`);
        

        const dataFormatada = `${diaFormatado}/${mesFormatado}/${ano} ${hora}:${minutos}:${segundos}`;

        console.log(dataFormatada); 


const produtosBD = {
    101: {
        id_produto: 101,
        nome: "Batarang Edição Limitada",
        quantidade_estoque: 295 // Estoque atual
    }
};

// Histórico simulado (Baseado nas colunas da tabela movimentacaoestoque)
const historicoMovimentacaoBD = [
    {
        id_movimentacao: 1,
        id_produto: 101,
        id_usuario: 501,
        tipo: 'ENTRADA',
        quantidade: 300,
        data_movimentacao: dataFormatada,
    },
    {



        id_movimentacao: 2,
        id_produto: 101,
        id_usuario: 502,
        tipo: 'SAIDA',
        quantidade: 5,
        data_movimentacao: dataFormatada,

    },
];

function buscarProdutoPorId(id) {
    return produtosBD[id];
}

function buscarHistoricoPorProduto(idProduto) {
    // Filtrar e ordenar pela data de movimentação (mais recente primeiro)
    return historicoMovimentacaoBD
        .filter(mov => mov.id_produto === idProduto)
        .sort((a, b) => new Date(b.data_movimentacao) - new Date(a.data_movimentacao));
}

const types = require('pg').types;

// Configura o parser para os tipos TIMESTAMP
types.setTypeParser(1184, (val) => val); // TIMESTAMP WITH TIME ZONE
types.setTypeParser(1114, (val) => val); // TIMESTAMP WITHOUT TIME ZONE

module.exports = bd, buscarProdutoPorId,
    buscarHistoricoPorProduto;