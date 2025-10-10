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
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

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
  if (!token) return res.status(403).json({ erro: "Token não fornecido" });
  if (token.startsWith("Bearer ")) token = token.slice(7);
  jwt.verify(token, "segredo", (err, decoded) => {
    if (err) return res.status(401).json({ erro: "Token inválido" });
    req.userId = decoded.id;
    next();
  });
}

// ---------------------- ROTAS ---------------------- //

// CRIAR UTILIZADOR
app.post("/usuarios", async (req, res) => {
  const { nome, email, senha } = req.body;
  const hash = await bcrypt.hash(senha, 10);
  db.query("INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
    [nome, email, hash],
    (err) => {
      if (err) return res.status(500).json({ erro: `Erro ao criar conta: ${err.message}` });
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

//VERIFICAR UTILIZADOR
app.post("/recuperar/verificar", async (req, res) => {
  const { email, nome } = req.body;

  if (!email || !nome) {
    return res.status(400).json({ erro: "Preencha email e nome." });
  }

  try {
    const [rows] = await db.promise().query(
      "SELECT * FROM usuarios WHERE email = ? AND nome = ?",
      [email, nome]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Utilizador não encontrado." });
    }

    res.json({ msg: "Utilizador verificado com sucesso." });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao verificar utilizador." });
  }
});

// ✅ ETAPA 2 - ALTERAR SENHA
app.post("/recuperar/alterar", async (req, res) => {
  const { email, nome, novaSenha } = req.body;

  if (!email || !nome || !novaSenha) {
    return res.status(400).json({ erro: "Preencha todos os campos." });
  }

  try {
    const hashed = await bcrypt.hash(novaSenha, 10);
    const [result] = await db.promise().query(
      "UPDATE usuarios SET senha = ? WHERE email = ? AND nome = ?",
      [hashed, email, nome]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Utilizador não encontrado." });
    }

    res.json({ msg: "Palavra passe alterada com sucesso!" });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao atualizar palavra passe." });
  }
});

//PRODUTOS

app.post("/produtos", autenticar, upload.single('imagem'), (req, res) => {
  const { titulo, descricao, preco, categoria } = req.body;
  const imagem_url = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = `
    INSERT INTO produtos (usuario_id, titulo, descricao, preco, categoria, imagem_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [req.userId, titulo, descricao, preco, categoria, imagem_url], (err, result) => {
    if (err) return res.status(500).json({ erro: "Erro ao criar produto." });
    res.status(201).json({ msg: "Produto criado com sucesso!", id: result.insertId });
  });
});

// LISTAR PRODUTOS
app.get("/produtos", (req, res) => {
  const sql = `
    SELECT p.*, u.nome AS usuario_nome 
    FROM produtos p
    JOIN usuarios u ON p.usuario_id = u.id
    ORDER BY p.data_publicacao DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ erro: "Erro ao listar produtos." });
    res.json(results);
  });
});

// INICIAR SERVIDOR
app.listen(3000, () => console.log("Servidor rodando em http://localhost:3000"));
