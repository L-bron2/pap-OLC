// IMPORTS
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

// iniciar express
const app = express();
app.use(express.json());
app.use(cors());

// criar pastas de uploads se não existirem
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("FTperfil")) fs.mkdirSync("FTperfil");

// MULTER (para upload de imagens de perfil)
const imgStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "FTperfil/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const uploadProfile = multer({ storage: imgStorage });

// MULTER (para upload de imagens de produtos)
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: productStorage });

// conexão com o banco de dados
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Erlander",
  database: "OLC",
});

// verificar conexão
db.connect((err) => {
  if (err) console.error("Erro ao conectar ao MySQL:", err.message);
  else console.log("Conectado ao MySQL (OLC)");
});

// servir pastas de uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/FTperfil", express.static(path.join(__dirname, "FTperfil")));

// função de autenticação JWT
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
  if (!nome || !email || !senha)
    return res.status(400).json({ erro: "Preencha todos os campos" });
  const hash = await bcrypt.hash(senha, 10);
  db.query(
    "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
    [nome, email, hash],
    (err) => {
      if (err) return res.status(500).json({ erro: err.message });
      res.json({ msg: "Conta criada com sucesso!" });
    }
  );
});

// login
app.post("/login", (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha)
    return res.status(400).json({ erro: "Email e senha são obrigatórios" });

  db.query(
    "SELECT * FROM usuarios WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) return res.status(500).json({ erro: err.message });
      if (!results || results.length === 0)
        return res.status(401).json({ erro: "Usuário não encontrado" });

      const user = results[0];
      const match = await bcrypt.compare(senha, user.senha);
      if (!match)
        return res.status(401).json({ erro: "Palavra passe incorreta" });

      const token = jwt.sign({ id: user.id }, "segredo", { expiresIn: "1h" });
      res.json({ token });
    }
  );
});

// verificar utilizador se existe
app.post("/recuperar/verificar", (req, res) => {
  const { email, nome } = req.body;
  if (!email || !nome)
    return res.status(400).json({ erro: "Preencha todos os campos" });
  db.query(
    "SELECT * FROM usuarios WHERE email = ? AND nome = ?",
    [email, nome],
    (err, results) => {
      if (err) return res.status(500).json({ erro: err.message });
      if (!results || results.length === 0)
        return res.status(404).json({ erro: "Utilizador não encontrado" }); 
      res.json({ msg: "Utilizador encontrado" });
    }
  );
});

// verificar utilizador para recuperar a senha
app.post("/recuperar/alterar", async (req, res) => {
  const { email, nome, novaSenha } = req.body;
  if (!email || !nome || !novaSenha)
    return res.status(400).json({ erro: "Preencha todos os campos" });
  const hash = await bcrypt.hash(novaSenha, 10);
  db.query(
    "UPDATE usuarios SET senha = ? WHERE email = ? AND nome = ?",
    [hash, email, nome],
    (err, result) => {
      if (err) return res.status(500).json({ erro: err.message });
      if (result.affectedRows === 0)
        return res.status(404).json({ erro: "Utilizador não encontrado" });
      res.json({ msg: "Palavra passe alterada com sucesso!" });
    }
  );
});

// obter usuário logado
app.get("/usuarios/id", autenticar, (req, res) => {
  const sql = "SELECT id, nome, email, foto_url FROM usuarios WHERE id = ?";
  db.query(sql, [req.userId], (err, results) => {
    if (err) return res.status(500).json({ erro: err.message });
    if (!results || results.length === 0)
      return res.status(404).json({ erro: "Usuário não encontrado" });
    res.json(results[0]);
  });
});

//GET de um usuário específico pelo ID
app.get("/usuarios/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ erro: "ID inválido" });
  db.query(
    "SELECT id, nome, foto_url FROM usuarios WHERE id = ?",
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ erro: err.message });
      if (!results || results.length === 0)
        return res.status(404).json({ erro: "Usuário não encontrado" });
      res.json(results[0]);
    }
  );
});

// atualizar foto de perfil
app.post(
  "/usuarios/foto",
  autenticar,
  uploadProfile.single("imagem"),
  (req, res) => {
    if (!req.file)
      return res.status(400).json({ erro: "Nenhuma imagem enviada" });
    const fotoUrl = `http://localhost:3000/FTperfil/${req.file.filename}`;
    db.query(
      "UPDATE usuarios SET foto_url = ? WHERE id = ?",
      [fotoUrl, req.userId],
      (err) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ msg: "Foto de perfil atualizada", foto_url: fotoUrl });
      }
    );
  }
);

// criar produto
app.post("/produtos", autenticar, upload.single("imagem"), (req, res) => {
  const { titulo, descricao, preco, categoria } = req.body;
  const imagem_url = req.file ? `/uploads/${req.file.filename}` : null;
  db.query(
    "INSERT INTO produtos (vendedor, titulo, descricao, preco, categoria, imagem_url) VALUES (?, ?, ?, ?, ?, ?)",
    [req.userId, titulo, descricao, preco, categoria, imagem_url],
    (err, result) => {
      if (err) return res.status(500).json({ erro: err.message });
      res.status(201).json({ msg: "Produto criado", id: result.insertId });
    }
  );
});

// listar produtos
app.get("/produtos", (req, res) => {
  db.query(
    `SELECT p.*, u.nome AS usuario_nome 
     FROM produtos p
     JOIN usuarios u ON p.vendedor = u.id
     ORDER BY p.data_publicacao DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ erro: err.message });
      res.json(results);
    }
  );
});

// listar todas mensagens do usuário
app.get("/mensagens", autenticar, (req, res) => {
  const id = req.userId;
  db.query(
    `SELECT m.*, ru.nome AS remetente_nome, du.nome AS destinatario_nome
     FROM mensagens m
     LEFT JOIN usuarios ru ON ru.id = m.remetente_id
     LEFT JOIN usuarios du ON du.id = m.destinatario_id
     WHERE remetente_id = ? OR destinatario_id = ?
     ORDER BY data_envio DESC`,
    [id, id],
    (err, rows) => {
      if (err) return res.status(500).json({ erro: err.message });
      res.json(rows);
    }
  );
});

// faz GET de uma mensagenm especifica 
app.get("/mensagens/conversa/:outro", autenticar, (req, res) => {
  const id = req.userId;
  const outro = parseInt(req.params.outro);
  if (isNaN(outro)) return res.status(400).json({ erro: "ID inválido" });

  db.query(
    `SELECT m.*, ru.nome AS remetente_nome, du.nome AS destinatario_nome
     FROM mensagens m
     LEFT JOIN usuarios ru ON ru.id = m.remetente_id
     LEFT JOIN usuarios du ON du.id = m.destinatario_id
     WHERE (remetente_id=? AND destinatario_id=?) OR (remetente_id=? AND destinatario_id=?)
     ORDER BY data_envio ASC`,
    [id, outro, outro, id],
    (err, rows) => {
      if (err) return res.status(500).json({ erro: err.message });
      res.json(rows);
    }
  );
});

// enviar mensagem
app.post("/mensagens", autenticar, (req, res) => {
  const remetente = req.userId;
  let { destinatario_id, texto, produto_id } = req.body;

  // verifica os campos do destinatatio da mensagem 
  if (!destinatario_id || !texto || texto.trim() === "")
    return res
      .status(400)
      .json({ erro: "destinatario_id e texto são obrigatórios" });

  destinatario_id = Number(destinatario_id);
  produto_id = produto_id ? Number(produto_id) : null;

  // verificar se destinatário existe
  db.query("SELECT id FROM usuarios WHERE id = ?", [destinatario_id], (err, rows) => {
    if (err) return res.status(500).json({ erro: err.message });
    if (!rows || rows.length === 0)
      return res.status(400).json({ erro: "Destinatário não encontrado" });

    db.query(
      "INSERT INTO mensagens (remetente_id, destinatario_id, produto_id, mensagem) VALUES (?,?,?,?)",
      [remetente, destinatario_id, produto_id, texto],
      (err2, result) => {
        if (err2) return res.status(500).json({ erro: err2.message });

        // devolver mensagem criada
        db.query(
          "SELECT * FROM mensagens WHERE id=?",
          [result.insertId],
          (err3, row) => {
            if (err3) return res.status(500).json({ erro: err3.message });
            res.json(row[0]);
          }
        );
      }
    );
  });
});

// iniciar servidor
app.listen(3000, () => console.log("Servidor rodando em http://localhost:3000"));
