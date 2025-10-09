// IMPORTS 
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

// CRIAR PASTA UPLOADS SE NÃO EXISTIR
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// CONFIGURAR MULTER
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// INICIALIZAR EXPRESS E MIDDLEWARES
const app = express();
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CONEXÃO MYSQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Erlander",
  database: "OLC"
});

// FUNÇÃO AUTENTICAR
function autenticar(req, res, next) {
  let token = req.headers["authorization"];
  if (!token) {
    return res.status(403).json({ erro: "Token não fornecido" });
  }

  // Aceita tanto "Bearer <token>" quanto só "<token>"
  if (token.startsWith("Bearer ")) {
    token = token.slice(7); // remove "Bearer "
  }

  jwt.verify(token, "segredo", (err, decoded) => {
    if (err) {
      console.error("Erro ao verificar token:", err.message);
      return res.status(401).json({ erro: "Token inválido" });
    }
    req.userId = decoded.id;
    next();
  });
}


// ROTAS
// CRIAR UTILIZADORES
app.post("/usuarios", async (req, res) => {
  const { nome, email, senha } = req.body;
  const hash = await bcrypt.hash(senha, 10);
  db.query("INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
    [nome, email, hash],
    (err) => {
      if (err) return res.status(500).json({err: `Erro ao criar a conta: ${err.message}`});
      res.json({ msg: "Conta criada com sucesso!" });
    });
});

// LOGIN
app.post("/login", (req, res) => {
  const { email, senha } = req.body;
  db.query("SELECT * FROM usuarios WHERE email = ?", [email], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ erro: "Usuário não encontrado" });
    const user = results[0];
    const match = await bcrypt.compare(senha, user.senha);
    if (!match) return res.status(401).json({ erro: "Palavra passe incorreta" });
    const token = jwt.sign({ id: user.id }, "segredo", { expiresIn: "1h" });
    res.json({ token });
  });
});

// RECUPERAR PALAVRA PASSE
app.post("/recuperar", async (req, res) => {
  const { email, nome, novaSenha } = req.body;

  if (!email || !nome || !novaSenha) {
    return res.status(400).json({ message: "Preencha todos os campos." });
  }

  // VERIFICA SE O UTILIZADOR EXISTE
  const [rows] = await db.promise().query(
    "SELECT * FROM usuarios WHERE email = ? AND nome = ?",
    [email, nome]
  );

  if (rows.length === 0) {
    return res.status(404).json({ message: "Conta não encontrado." });
  }

  // ENCIRPTA A NOVA PALAVRA PASSE
  const hashed = await bcrypt.hash(novaSenha, 10);

  // ATUALIZA NA BASE DE DADOS
  await db.promise().query(
    "UPDATE usuarios SET senha = ? WHERE email = ? AND nome = ?",
    [hashed, email, nome]
  );

  res.json({ message: "Palavra-passe alterada com sucesso!" });
})

// CRIAR PRODUTOS
app.post("/produtos", autenticar, upload.single('imagem'), (req, res) => {
  const { titulo, descricao, preco, categoria } = req.body;
  let imagem_url = null;

  if (req.file) {
    imagem_url = `/uploads/${req.file.filename}`;
  }

  const sql = `
    INSERT INTO produtos (usuario_id, titulo, descricao, preco, categoria, imagem_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [req.userId, titulo, descricao, preco, categoria, imagem_url], (err, result) => {
    if (err) {
      console.error("Erro ao inserir produto:", err);
      return res.status(500).json({ erro: "Erro ao criar produto" });
    }
    res.status(201).json({ msg: "Produto criado com sucesso!", id: result.insertId });
  });
});


// LISTAR PRODUTOS
app.get("/produtos", (req, res) => {
  const sql = `
    SELECT 
      p.*, 
      u.nome AS usuario_nome 
    FROM produtos p
    JOIN usuarios u ON p.usuario_id = u.id
    ORDER BY p.data_publicacao DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao listar produtos:", err);
      return res.status(500).json({ erro: "Erro ao listar produtos." });
    }
    res.json(results);
  });
});


// ENVIAR MENSAGENS
app.post("/mensagens", autenticar, (req, res) => {
  const { destinatario_id, produto_id, mensagem } = req.body;
  db.query("INSERT INTO mensagens (remetente_id, destinatario_id, produto_id, mensagem) VALUES (?, ?, ?, ?)",
    [req.userId, destinatario_id, produto_id, mensagem],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ msg: "Mensagem enviada!" });
    });
});

// INBOX
app.get("/mensagens", autenticar, (req, res) => {
  db.query("SELECT * FROM mensagens WHERE remetente_id = ? OR destinatario_id = ? ORDER BY data_envio DESC",
    [req.userId, req.userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    });
});

// INICIAR SERVIDOR
app.listen(3000, () => console.log("Servidor rodando em http://localhost:3000"));
