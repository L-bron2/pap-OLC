// IMPORTS
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

// iniciar express  ← 🔹 MOVEU-SE PARA CIMA
const app = express();
app.use(express.json());
app.use(cors());

// pasta para uploads de imagens dos produtos
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

//pasta para uploads de fotos de perfil
if (!fs.existsSync("FTperfil")) {
  fs.mkdirSync("FTperfil");
}

// MULTER(para upload de imagens dos perfis)
const imgStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "FTperfil/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
// configurar multer para perfis (usar a opção 'storage')
const uploadProfile = multer({ storage: imgStorage });

// conexão com o banco de dados 
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Erlander",
  database: "OLC",
});

// verificar conexão (ajuda a diagnosticar erros 500 quando o BD não está disponível)
db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err.message);
  } else {
    console.log('Conectado ao MySQL (OLC)');
  }
});

// LOGIN 
app.post("/login", (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha)
    return res
      .status(400)
      .json({ erro: "Email e senha são obrigatórios" });

  db.query("SELECT * FROM usuarios WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ erro: err.message });
    if (!results || results.length === 0)
      return res.status(401).json({ erro: "Usuário não encontrado" });

    const user = results[0];
    const match = await bcrypt.compare(senha, user.senha);
    if (!match)
      return res.status(401).json({ erro: "Palavra passe incorreta" });

    const token = jwt.sign({ id: user.id }, "segredo", { expiresIn: "1h" });
    res.json({ token });
  });
});

// MULTER(para upload de imagens dos produtos)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/FTperfil", express.static(path.join(__dirname, "FTperfil")));

// funcão para autenticar token JWT
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

// criar conta
app.post("/usuarios", async (req, res) => {
  const { nome, email, senha } = req.body;
  const hash = await bcrypt.hash(senha, 10);
  db.query(
    "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
    [nome, email, hash],
    (err) => {
      if (err)
        return res
          .status(500)
          .json({ erro: `Erro ao criar conta: ${err.message}` });
      res.json({ msg: "Conta criada com sucesso!" });
    }
  );
});

// Obter o utilizador logado
app.get("/usuarios/id", autenticar, (req, res) => {
  const userId = req.userId;
  const sql = `SELECT id, nome, email, foto_url FROM usuarios WHERE id = ?`;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Erro /usuarios/id:', err);
      return res.status(500).json({ erro: err.message });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ erro: 'Utilizador não encontrado' });
    }

    res.json(results); // retorna array mesmo com 1 item
  });
});

// Atualizar foto de perfil
app.post('/usuarios/foto', autenticar, uploadProfile.single('imagem'), (req, res) => {
  const userId = req.userId;
  if (!req.file) return res.status(400).json({ erro: 'Nenhuma imagem enviada.' });

  const fotoUrl = `/FTperfil/${req.file.filename}`;
  db.query('UPDATE usuarios SET foto_url = ? WHERE id = ?', [fotoUrl, userId], (err, result) => {
    if (err) {
      console.error('Erro ao atualizar foto de perfil:', err);
      return res.status(500).json({ erro: 'Erro ao atualizar foto de perfil.' });
    }
    return res.json({ msg: 'Foto de perfil atualizada com sucesso.', foto_url: fotoUrl });
  });
});



//verificar utilizador para recuperar palavra passe
app.post("/recuperar/verificar", async (req, res) => {
  const { email, nome } = req.body;

  if (!email || !nome) {
    return res.status(400).json({ erro: "Preencha email e nome." });
  }

  try {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM usuarios WHERE email = ? AND nome = ?", [
        email,
        nome,
      ]);

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Utilizador não encontrado." });
    }

    res.json({ msg: "Utilizador verificado com sucesso." });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao verificar utilizador." });
  }
});

//recuperar a palavra passe
app.post("/recuperar/alterar", async (req, res) => {
  const { email, nome, novaSenha } = req.body;

  if (!email || !nome || !novaSenha) {
    return res.status(400).json({ erro: "Preencha todos os campos." });
  }

  try {
    const hashed = await bcrypt.hash(novaSenha, 10);
    const [result] = await db
      .promise()
      .query("UPDATE usuarios SET senha = ? WHERE email = ? AND nome = ?", [
        hashed,
        email,
        nome,
      ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Utilizador não encontrado." });
    }

    res.json({ msg: "Palavra passe alterada com sucesso!" });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao atualizar palavra passe." });
  }
});

//produtos
app.post("/produtos", autenticar, upload.single("imagem"), (req, res) => {
  const { titulo, descricao, preco, categoria } = req.body;
  const imagem_url = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = `
    INSERT INTO produtos (usuario_id, titulo, descricao, preco, categoria, imagem_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [req.userId, titulo, descricao, preco, categoria, imagem_url],
    (err, result) => {
      if (err) return res.status(500).json({ erro: "Erro ao criar produto." });
      res
        .status(201)
        .json({ msg: "Produto criado com sucesso!", id: result.insertId });
    }
  );
});

// listar produtos
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

//inicia o servidor
app.listen(3000, () =>
  console.log("Servidor rodando em http://localhost:3000")
);
