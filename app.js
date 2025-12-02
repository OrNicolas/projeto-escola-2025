const express = require('express');
const path = require('path');
const app = express();
const rotas = express.Router();
const bd = require('./db');

// --- 1. CONFIGURAÇÃO DE PARSERS E VIEW ENGINE ---
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));


// --- 2. CONFIGURAÇÃO DE SESSÃO PERSISTENTE (Única Definição) ---
const session = require('express-session');
const pgSession =require('connect-pg-simple')(session);
app.use(session({

    store: new pgSession({
        pool: bd,
        tableName: 'sessoes',
        createTableIfMissing: true
    }),


    secret: 'sesisenai', // chave secreta para assinar o cookie de sessão
    resave: false, // não salvar a sessão se não houver modificações
    saveUninitialized: false,
    cookie :{maxAge: 1000 * 60 * 60 * 24,
    } // salvar sessões não inicializadas
}));
app.set('trust proxy', 1)


// --- 3. MIDDLEWARE DE AUTENTICAÇÃO ---
const verificarLogin = (req, res, next) => {
    res.locals.usuario = req.session.usuario || null; 

    if (req.session.usuario) {
        next();
    } else {
        res.redirect('/admin/login'); 
    }
}
const landingRotas = require('./routes/landing');
app.use('/', landingRotas)


app.get ('/admin', (req, res) => {
    res.redirect('/');
});


// Rotas da Administração (Contém o /login, que não deve ter verificarLogin)
const adminRotas = require('./routes/admin');
app.use('/admin', adminRotas); 


// Rotas Protegidas (Todas as rotas NESSES arquivos usam verificarLogin)
const ProdutosRotas = require("./routes/produtos");
app.use('/produtos', verificarLogin, ProdutosRotas);

const CategoriasRotas = require("./routes/categorias");
app.use('/categorias', verificarLogin, CategoriasRotas);

const UsuariosRotas = require("./routes/usuarios");
app.use('/usuarios', verificarLogin, UsuariosRotas);

const relatoriosRoutes = require('./routes/relatorios');
app.use('/relatorios', verificarLogin, relatoriosRoutes);


// --- 5. INICIALIZAÇÃO DO SERVIDOR ---
const porta = process.env.PORT || 3001;
app.listen(porta, () => {
    console.log(`Servidor rodando na porta http://192.168.0.168:${porta} `);
});

module.exports = rotas;