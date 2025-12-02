const { Pool } = require('pg');


const bd = new Pool(
    {
        user: 'postgres', //Usuario cadastrado no banco de dados
        host: 'localhost', //Servidor do banco de dados
        database: 'projeto_2025', //Nome do banco de dados
        password: 'admin', //Senha do banco de dados
        port: 5432, //Porta padrao do postgresql
    }
);

// const bd = new Pool(
//     {
//    connectionString: process.env.DATABASE_URL
//     }
// );

// const pool = new Pool({
//     // ⚠️ CONFIRME QUE ESTES VALORES SÃO IDÊNTICOS AOS DO SEU BANCO DE DADOS ⚠️
//     user: process.env.DB_USER,        // Usuário correto
//     host: process.env.DB_HOST,        // Deve ser 'localhost' ou '127.0.0.1' para desenvolvimento local
//     database: process.env.DB_DATABASE, // Nome do DB existe e está correto
//     password: process.env.DB_PASSWORD, // Senha correta (você já corrigiu o problema de string aqui)
//     port: process.env.DB_PORT || 5432, 
// });

module.exports = bd;