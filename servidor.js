const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Conexão com MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Erlander",
  database: "OLC"
});

// Função para verificar token
function autenticar(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ erro: "Token não fornecido" });

  jwt.verify(token, "segredo", (err, decoded) => {
    if (err) return res.status(401).json({ erro: "Token inválido" });
    req.userId = decoded.id;
    next();
  });
}

// Rotas

// Registrar utilizador
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

// Login
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

// Criar produto
app.post("/produtos", autenticar, (req, res) => {
  const { titulo, descricao, preco, categoria, imagem_url } = req.body;

  db.query("INSERT INTO produtos (usuario_id, titulo, descricao, preco, categoria, imagem_url) VALUES (?, ?, ?, ?, ?, ?)",
    [req.userId, titulo, descricao, preco, categoria, imagem_url],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ msg: "Produto criado com sucesso!" });
    });
});

// Listar produtos
app.get("/produtos", (req, res) => {
  db.query("SELECT p.*, u.nome as  usuario_id FROM produtos p JOIN utilizador u ON p.usuario_id = u.id", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Enviar mensagem
app.post("/mensagens", autenticar, (req, res) => {
  const { destinatario_id, produto_id, mensagem } = req.body;

  db.query("INSERT INTO mensagens (remetente_id, destinatario_id, produto_id, mensagem) VALUES (?, ?, ?, ?)",
    [req.userId, destinatario_id, produto_id, mensagem],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ msg: "Mensagem enviada!" });
    });
});

// Inbox
app.get("/mensagens", autenticar, (req, res) => {
  db.query("SELECT * FROM mensagens WHERE remetente_id = ? OR destinatario_id = ? ORDER BY data_envio DESC",
    [req.userId, req.userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    });
});

// Iniciar servidor
app.listen(3000, () => console.log("Servidor rodando em http://localhost:3000"));


