//IMPORTES//
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const nodemailer = require("nodemailer");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// URL base usada para criar links nos emails.
const APP_URL = process.env.APP_URL || "http://localhost:3000";
const JWT_SECRET = process.env.JWT_SECRET || "segredo";
const RESET_SECRET = process.env.RESET_SECRET || `${JWT_SECRET}-recuperar`;

// Criar pastas de uploads de fotos se não existire
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("FTperfil")) fs.mkdirSync("FTperfil");

// Upload de imagens de perfil
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

// Upload de imagens de produtos
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: productStorage });

// CONEXÃO COM A BD//
const db = mysql.createConnection({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
});

db.connect((err) => {
  if (err) console.error("Erro ao conectar ao MySQL:", err.message);
  else console.log("Conectado ao MySQL (OLC)");
});

//SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.email_user,
    pass: process.env.email_pass,
  },
});


// Template unico para os emails da aplicacao. Mantem o mesmo esilo
function criarTemplateEmail({ titulo, subtitulo, texto, botao, link }) {
  return `
    <div style="margin:0;padding:32px;background:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0f172a;">
      <div style="max-width:560px;margin:0 auto;background:rgba(255,255,255,.94);border:1px solid rgba(0,0,0,.08);border-radius:22px;box-shadow:0 25px 70px rgba(15,23,42,.16);overflow:hidden;">
        <div style="padding:28px 32px;border-bottom:1px solid rgba(0,0,0,.08);">
          <div style="font-size:22px;font-weight:700;color:#0f172a;">Trovix</div>
          <div style="margin-top:8px;color:#64748b;font-size:14px;">${subtitulo}</div>
        </div>
        <div style="padding:32px;">
          <h1 style="margin:0 0 14px 0;font-size:26px;line-height:1.25;color:#0f172a;">${titulo}</h1>
          <p style="margin:0 0 24px 0;font-size:15px;line-height:1.7;color:#475569;">${texto}</p>
          <a href="${link}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;border-radius:12px;padding:14px 20px;">${botao}</a>
          <p style="margin:24px 0 0 0;font-size:12px;line-height:1.6;color:#64748b;">Se o botao nao funcionar, abra este link no navegador:<br><a href="${link}" style="color:#0f172a;word-break:break-all;">${link}</a></p>
        </div>
      </div>
    </div>
  `;
}

// Envia um email de boas-vindas depois de criar a conta.
async function enviarEmailContaCriada(userEmail, userName) {
  const linkLogin = `${APP_URL}/Login/login.html`;

  await transporter.sendMail({
    from: `Trovix <${process.env.email_user}>`,
    to: userEmail,
    subject: "Conta criada com sucesso - Trovix",
    text: `Ola ${userName}, a sua conta foi criada com sucesso. Aceda ao site: ${linkLogin}`,
    html: criarTemplateEmail({
      titulo: `Bem-vindo/a, ${userName}!`,
      subtitulo: "A sua conta Trovix ja esta pronta.",
      texto:
        "A conta foi criada com sucesso. Pode entrar no site, explorar produtos, guardar favoritos e conversar com vendedores.",
      botao: "Aceder ao site",
      link: linkLogin,
    }),
  });
}

// Envia um link temporario para recuperar a palavra-passe.
async function enviarEmailRecuperacaoSenha(userEmail, userName, token) {
  const linkRecuperacao = `${APP_URL}/recuperarSenha/rSenha.html?token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from: `Trovix <${process.env.email_user}>`,
    to: userEmail,
    subject: "Recuperar palavra-passe - Trovix",
    text: `Ola ${userName}, use este link para recuperar a sua palavra-passe: ${linkRecuperacao}`,
    html: criarTemplateEmail({
      titulo: "Recuperar palavra-passe",
      subtitulo: "Recebemos um pedido para alterar a sua palavra-passe.",
      texto:
        "Clique no botao abaixo para escolher uma nova palavra-passe. Por seguranca, este link expira em 15 minutos.",
      botao: "Criar nova palavra-passe",
      link: linkRecuperacao,
    }),
  });
}

// pastas de uploads
app.use("/Login", express.static(path.join(__dirname, "Login")));
app.use("/inicio", express.static(path.join(__dirname, "inicio")));
app.use(
  "/recuperarSenha",
  express.static(path.join(__dirname, "recuperarSenha")),
);
app.use("/criar conta", express.static(path.join(__dirname, "criar conta")));
app.use("/criar%20conta", express.static(path.join(__dirname, "criar conta")));
app.use("/Perfil", express.static(path.join(__dirname, "Perfil")));
app.use("/favoritos", express.static(path.join(__dirname, "favoritos")));
app.use("/conversas", express.static(path.join(__dirname, "conversas")));
app.use("/produtos", express.static(path.join(__dirname, "produtos")));
app.use("/admin", express.static(path.join(__dirname, "admin")));
app.use("/favicon", express.static(path.join(__dirname, "favicon")));
app.use("/shared", express.static(path.join(__dirname, "shared")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/FTperfil", express.static(path.join(__dirname, "FTperfil")));

//MIDDLEWARE //
function autenticar(req, res, next) {
  let token = req.headers["authorization"];
  if (!token) return res.status(403).json({ erro: "Token não fornecido" });
  if (token.startsWith("Bearer ")) token = token.slice(7);
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ erro: "Token inválido" });
    // armazenar id e role do token no request
    req.userId = decoded.id;
    req.role = decoded.role; // 'user' ou 'admin'
    next();
  });
}

// Middleware para autorizar apenas administradores
function autorizarAdmin(req, res, next) {
  if (req.role !== "admin")
    return res
      .status(403)
      .json({ erro: "Área reservada para administradores" });
  next();
}

// Pede a recuperacao da palavra-passe e envia o link por email.
app.post("/recuperar/pedir-email", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ erro: "Email e obrigatorio" });

  db.query(
    "SELECT id, nome, email FROM usuarios WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) return res.status(500).json({ erro: err.message });
      if (!results || results.length === 0)
        return res
          .status(404)
          .json({ erro: "Nao existe conta com esse email" });

      const user = results[0];
      const token = jwt.sign({ id: user.id }, RESET_SECRET, {
        expiresIn: "15m",
      });

      try {
        await enviarEmailRecuperacaoSenha(user.email, user.nome, token);
        res.json({
          msg: "Email para recuperar a palavra passe enviado!, verifique o seu email",
        });
      } catch (emailErr) {
        console.error("Erro ao enviar email de recuperacao:", emailErr.message);
        res.status(500).json({ erro: "Nao foi possivel enviar o email" });
      }
    },
  );
});

// envia o email com o link temporario.
app.post("/recuperar/verificar", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ erro: "Email e obrigatorio" });

  db.query(
    "SELECT id, nome, email FROM usuarios WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) return res.status(500).json({ erro: err.message });
      if (!results || results.length === 0)
        return res
          .status(404)
          .json({ erro: "Nao existe conta com esse email" });

      const user = results[0];
      const token = jwt.sign({ id: user.id }, RESET_SECRET, {
        expiresIn: "15m",
      });

      try {
        await enviarEmailRecuperacaoSenha(user.email, user.nome, token);
        res.json({ msg: "Email de recuperacao enviado com sucesso!" });
      } catch (emailErr) {
        console.error("Erro ao enviar email de recuperacao:", emailErr.message);
        res.status(500).json({ erro: "Nao foi possivel enviar o email" });
      }
    },
  );
});

// Alterar palavra-passe usando o token recebido no email.
app.post("/recuperar/alterar", async (req, res) => {
  const { token, novaSenha } = req.body;
  if (!token || !novaSenha)
    return res.status(400).json({ erro: "Preencha todos os campos" });

  try {
    const decoded = jwt.verify(token, RESET_SECRET);
    const hash = await bcrypt.hash(novaSenha, 10);

    db.query(
      "UPDATE usuarios SET senha = ? WHERE id = ?",
      [hash, decoded.id],
      (err, result) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (result.affectedRows === 0)
          return res.status(404).json({ erro: "Utilizador nao encontrado" });
        res.json({ msg: "Palavra-passe alterada com sucesso!" });
      },
    );
  } catch (err) {
    res.status(401).json({ erro: "Link invalido ou expirado" });
  }
});

// Verificar utilizador para recuperar senha
app.post("/recuperar/verificar-antigo", (req, res) => {
  const { email, nome } = req.body;
  if (!email || !nome)
    return res.status(400).json({ erro: "Email e nome são obrigatórios" });
  db.query(
    "SELECT * FROM usuarios WHERE email = ? AND nome = ?",
    [email, nome],
    (err, results) => {
      if (err) return res.status(500).json({ erro: err.message });
      if (!results || results.length === 0)
        return res.status(404).json({ erro: "Utilizador não encontrado" });
      res.json({ msg: "Utilizador encontrado" });
    },
  );
});

// Alterar palavra passe
app.post("/recuperar/alterar-antigo", async (req, res) => {
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
    },
  );
});

// Criar conta
app.post("/usuarios", async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha)
    return res.status(400).json({ erro: "Preencha todos os campos" });
  const hash = await bcrypt.hash(senha, 10);
  // definir role padrão como 'user' ao criar conta
  db.query(
    "INSERT INTO usuarios (nome, email, senha, role) VALUES (?, ?, ?, ?)",
    [nome, email, hash, "user"],
    async (err) => {
      if (err) return res.status(500).json({ erro: err.message });
      try {
        await enviarEmailContaCriada(email, nome);
      } catch (emailErr) {
        console.error("Conta criada, mas falhou o email:", emailErr.message);
      }
      res.json({ msg: "Conta criada com sucesso!" });
    },
  );
});

// Apagar conta do utilizador logado
app.post("/apagarConta", autenticar, (req, res) => {
  const userId = req.userId;

  // apaga os dados das outras tabelas a onde o id do utilizador for igual
  db.query("DELETE FROM favoritos WHERE id_usuario = ?", [userId], (err) => {
    if (err) return res.status(500).json({ erro: err.message });

    db.query(
      "DELETE FROM mensagens WHERE remetente_id = ? OR destinatario_id = ?",
      [userId, userId],
      (err2) => {
        if (err2) return res.status(500).json({ erro: err2.message });

        db.query(
          "DELETE FROM produtos WHERE vendedor = ?",
          [userId],
          (err3) => {
            if (err3) return res.status(500).json({ erro: err3.message });

            db.query(
              "DELETE FROM usuarios WHERE id = ?",
              [userId],
              (err4, result) => {
                if (err4) return res.status(500).json({ erro: err4.message });
                if (!result || result.affectedRows === 0)
                  return res
                    .status(404)
                    .json({ erro: "Usuário não encontrado" });

                // Sucesso
                return res.json({ msg: "Conta apagada com sucesso" });
              },
            );
          },
        );
      },
    );
  });
});

// Login
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

      // incluir a role no token para permitir verificações de autorização
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
        expiresIn: "1h",
      });
      res.json({ token });
    },
  );
});

// get do usuário logado
app.get("/usuarios/id", autenticar, (req, res) => {
  // Retorna também a role para permitir verificações client-side
  const sql =
    "SELECT id, nome, email, foto_url, role FROM usuarios WHERE id = ?";
  db.query(sql, [req.userId], (err, results) => {
    if (err) return res.status(500).json({ erro: err.message });
    if (!results || results.length === 0)
      return res.status(404).json({ erro: "Usuário não encontrado" });
    res.json(results[0]);
  });
});

// Atualizar dados do usuário (nome, descricao) e permitir remover foto
app.patch("/usuarios", autenticar, (req, res) => {
  const userId = req.userId;
  const { nome, descricao, remover_foto } = req.body;

  // Helper para transformar URL em caminho local
  function toLocalPath(url) {
    if (!url) return null;
    if (url.startsWith("/")) return url.slice(1);
    try {
      const parsed = new URL(url);
      return parsed.pathname.startsWith("/")
        ? parsed.pathname.slice(1)
        : parsed.pathname;
    } catch (e) {
      return url;
    }
  }

  // remover foto, buscar a foto atual e eliminar ficheiro
  if (remover_foto) {
    db.query(
      "SELECT foto_url FROM usuarios WHERE id = ?",
      [userId],
      (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        const foto = rows && rows[0] ? rows[0].foto_url : null;
        if (foto) {
          const fotoPath = toLocalPath(foto);
          if (fotoPath) {
            const fullFoto = path.join(__dirname, fotoPath);
            fs.unlink(fullFoto, (unlinkErr) => {
              if (unlinkErr)
                console.warn(
                  "Aviso - Não foi possível apagar foto do utilizador:",
                  unlinkErr.message,
                );
            });
          }
        }

        db.query(
          "UPDATE usuarios SET foto_url = NULL WHERE id = ?",
          [userId],
          (err2) => {
            if (err2) return res.status(500).json({ erro: err2.message });
            return res.json({ msg: "Foto removida com sucesso" });
          },
        );
      },
    );
    return;
  }

  //query dinâmica para nome
  const fields = [];
  const params = [];
  if (typeof nome === "string" && nome.trim() !== "") {
    fields.push("nome = ?");
    params.push(nome.trim());
  }
  if (typeof descricao === "string") {
    fields.push("descricao = ?");
    params.push(descricao);
  }

  if (fields.length === 0) {
    return res.status(400).json({ erro: "Nada para atualizar" });
  }

  const sql = `UPDATE usuarios SET ${fields.join(", ")} WHERE id = ?`;
  params.push(userId);
  db.query(sql, params, (err3, result) => {
    if (err3) return res.status(500).json({ erro: err3.message });
    return res.json({ msg: "Dados atualizados com sucesso" });
  });
});

// Rota administrativa: listar todos os utilizadores (apenas admins)
app.get("/usuarios", autenticar, autorizarAdmin, (req, res) => {
  db.query(
    "SELECT id, nome, email, role, foto_url FROM usuarios ORDER BY id ASC",
    (err, rows) => {
      if (err) return res.status(500).json({ erro: err.message });
      res.json(rows);
    },
  );
});

// GET de um usuário específico pelo ID
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
    },
  );
});

// Rota administrativa apagar um utilizador pelo id (apaga produtos, favoritos, mensagens e imagem de perfil)
// Apenas administradores 
app.delete("/usuarios/:id", autenticar, autorizarAdmin, (req, res) => {
  const targetId = parseInt(req.params.id);
  if (isNaN(targetId)) return res.status(400).json({ erro: "ID inválido" });

  //  Buscar produtos do utilizador para poder remover imagens e dados relacionados
  db.query(
    "SELECT id, imagem_url FROM produtos WHERE vendedor = ?",
    [targetId],
    (err, produtos) => {
      if (err) return res.status(500).json({ erro: err.message });

      const prodIds = (produtos || []).map((p) => p.id);

      // helper para converter URLs/paths em caminhos locais para unlink
      function toLocalPath(url) {
        if (!url) return null;
        if (url.startsWith("/")) return url.slice(1);
        try {
          const parsed = new URL(url);
          return parsed.pathname.startsWith("/")
            ? parsed.pathname.slice(1)
            : parsed.pathname;
        } catch (e) {
          // se URL válida, retornar como estava
          return url;
        }
      }

      //Apagar favoritos associados aos produtos
      const deleteFavsForProducts = (cb) => {
        if (!prodIds.length) return cb();
        db.query(
          "DELETE FROM favoritos WHERE id_produto IN (?)",
          [prodIds],
          (err2) => {
            if (err2) return res.status(500).json({ erro: err2.message });
            cb();
          },
        );
      };

      deleteFavsForProducts(() => {
        // Apagar mensagens relacionadas a esses produtos
        const deleteMsgsForProducts = (done) => {
          if (!prodIds.length) return done();
          db.query(
            "DELETE FROM mensagens WHERE produto_id IN (?)",
            [prodIds],
            (err3) => {
              if (err3) return res.status(500).json({ erro: err3.message });
              done();
            },
          );
        };

        deleteMsgsForProducts(() => {
          //Apagar os produtos em si
          db.query(
            "DELETE FROM produtos WHERE vendedor = ?",
            [targetId],
            (err4) => {
              if (err4) return res.status(500).json({ erro: err4.message });

              // remover ficheiros de imagem dos produtos
              produtos.forEach((p) => {
                if (p.imagem_url) {
                  const imgPath = toLocalPath(p.imagem_url);
                  if (imgPath) {
                    const full = path.join(__dirname, imgPath);
                    fs.unlink(full, (unlinkErr) => {
                      if (unlinkErr)
                        console.warn(
                          "Aviso - Não foi possível apagar imagem do produto:",
                          unlinkErr.message,
                        );
                    });
                  }
                }
              });

              // Apagar favoritos do próprio utilizador
              db.query(
                "DELETE FROM favoritos WHERE id_usuario = ?",
                [targetId],
                (err5) => {
                  if (err5) return res.status(500).json({ erro: err5.message });

                  // Apagar mensagens em que o utilizador é remetente ou destinatário
                  db.query(
                    "DELETE FROM mensagens WHERE remetente_id = ? OR destinatario_id = ?",
                    [targetId, targetId],
                    (err6) => {
                      if (err6)
                        return res.status(500).json({ erro: err6.message });

                      // Buscar foto de perfil para remover ficheiro
                      db.query(
                        "SELECT foto_url FROM usuarios WHERE id = ?",
                        [targetId],
                        (err7, rows7) => {
                          if (err7)
                            return res.status(500).json({ erro: err7.message });
                          const foto =
                            rows7 && rows7[0] ? rows7[0].foto_url : null;

                          //Apagar o utilizador
                          db.query(
                            "DELETE FROM usuarios WHERE id = ?",
                            [targetId],
                            (err8, result8) => {
                              if (err8)
                                return res
                                  .status(500)
                                  .json({ erro: err8.message });
                              if (!result8 || result8.affectedRows === 0)
                                return res
                                  .status(404)
                                  .json({ erro: "Usuário não encontrado" });

                              // remover ficheiro de foto de perfil (se existir)
                              if (foto) {
                                const fotoPath = toLocalPath(foto);
                                if (fotoPath) {
                                  const fullFoto = path.join(
                                    __dirname,
                                    fotoPath,
                                  );
                                  fs.unlink(fullFoto, (unlinkErr2) => {
                                    if (unlinkErr2)
                                      console.warn(
                                        "Aviso - Não foi possível apagar foto do utilizador:",
                                        unlinkErr2.message,
                                      );
                                  });
                                }
                              }

                              return res.json({
                                msg: "Usuário apagado com sucesso",
                              });
                            },
                          );
                        },
                      );
                    },
                  );
                },
              );
            },
          );
        });
      });
    },
  );
});

// Atualizar foto de perfil
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
      },
    );
  },
);

// Criar produto
app.post("/produtos", autenticar, upload.single("imagem"), (req, res) => {
  // token já validado pelo middleware `autenticar`; `req.userId` e `req.role` disponíve
  const { titulo, descricao, preco, categoria } = req.body;
  const imagem_url = req.file ? `/uploads/${req.file.filename}` : null;
  db.query(
    "INSERT INTO produtos (vendedor, titulo, descricao, preco, categoria, imagem_url) VALUES (?, ?, ?, ?, ?, ?)",
    [req.userId, titulo, descricao, preco, categoria, imagem_url],
    (err, result) => {
      if (err) return res.status(500).json({ erro: err.message });
      res.status(201).json({ msg: "Produto criado", id: result.insertId });
    },
  );
});

// categorias disponíveis
app.get("/categorias", (req, res) => {
  db.query("SELECT DISTINCT categoria FROM produtos", (err, rows) => {
    if (err) {
      console.error("Erro ao buscar categorias:", err.message);
      return res.status(500).json({ erro: "Erro ao buscar categorias" });
    }
    res.json(rows);
  });
});

// Listar produtos
app.get("/produtos", (req, res) => {
  db.query(
    `SELECT p.*, u.nome AS usuario_nome
     FROM produtos p
     JOIN usuarios u ON p.vendedor = u.id
     ORDER BY p.data_publicacao DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ erro: err.message });
      res.json(results);
    },
  );
});

//filtro de produtos por categoria
app.get("/produtos/categoria/:categoria", (req, res) => {
  const categoria = req.params.categoria;
  db.query(
    `SELECT p.*, u.nome AS usuario_nome
      FROM produtos p
      JOIN usuarios u ON p.vendedor = u.id
      WHERE p.categoria = ?
      ORDER BY p.data_publicacao DESC`,
    [categoria],
    (err, results) => {
      if (err) return res.status(500).json({ erro: err.message });
      res.json(results);
    },
  );
});

// Listar produtos do usuário logado
app.get("/meuProdutos", autenticar, (req, res) => {
  const userId = req.userId;

  db.query(
    `SELECT p.*, u.nome AS usuario_nome
     FROM produtos p
     JOIN usuarios u ON p.vendedor = u.id
     WHERE p.vendedor = ?
     ORDER BY p.data_publicacao DESC`,
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ erro: err.message });
      res.json(results);
    },
  );
});

// Apagar produto, apaga tudo relacionado a esse produto
app.delete("/produtos/:id", autenticar, (req, res) => {
  const prodId = parseInt(req.params.id);
  console.log(
    "DELETE /produtos/:id chamada com prodId:",
    prodId,
    "userId:",
    req.userId,
  );

  if (isNaN(prodId)) {
    console.log("ID inválido");
    return res.status(400).json({ erro: "ID inválido" });
  }

  //verifica se o produto existe e se o utilizador é o vendedor
  db.query(
    "SELECT vendedor, imagem_url FROM produtos WHERE id = ?",
    [prodId],
    (err, rows) => {
      if (err) {
        console.error("Erro ao buscar produto:", err);
        return res
          .status(500)
          .json({ erro: "Erro ao buscar produto: " + err.message });
      }

      if (!rows || rows.length === 0) {
        console.log("Produto não encontrado:", prodId);
        return res.status(404).json({ erro: "Produto não encontrado" });
      }

      const produto = rows[0];
      console.log(
        "Produto encontrado. Vendedor:",
        produto.vendedor,
        "UserId:",
        req.userId,
      );

      // permitir que o vendedor apague seu produto OU que um admin apague qualquer produto
      if (produto.vendedor !== req.userId && req.role !== "admin") {
        console.log("Não autorizado");
        return res
          .status(403)
          .json({ erro: "Não autorizado a apagar este produto" });
      }

      //Remover favoritos
      db.query(
        "DELETE FROM favoritos WHERE id_produto = ?",
        [prodId],
        (errFav) => {
          if (errFav) {
            console.error("Erro ao apagar favoritos:", errFav);
            return res
              .status(500)
              .json({ erro: "Erro ao apagar favoritos: " + errFav.message });
          }

          // Remover mensagens
          db.query(
            "DELETE FROM mensagens WHERE produto_id = ?",
            [prodId],
            (errMsg) => {
              if (errMsg) {
                console.error("Erro ao apagar mensagens:", errMsg);
                return res.status(500).json({
                  erro: "Erro ao apagar mensagens: " + errMsg.message,
                });
              }

              //  Apagar o produto
              console.log("Apagando produto:", prodId);
              db.query(
                "DELETE FROM produtos WHERE id = ?",
                [prodId],
                (err2, result) => {
                  if (err2) {
                    console.error("Erro ao apagar produto:", err2);
                    return res.status(500).json({
                      erro: "Erro ao apagar produto: " + err2.message,
                    });
                  }

                  // apaga a imagem do produto tbm
                  if (produto.imagem_url) {
                    console.log("Removendo imagem:", produto.imagem_url);
                    const imgPath = produto.imagem_url.startsWith("/")
                      ? produto.imagem_url.slice(1)
                      : produto.imagem_url;
                    const fullPath = path.join(__dirname, imgPath);
                    fs.unlink(fullPath, (unlinkErr) => {
                      if (unlinkErr) {
                        console.warn(
                          "Aviso - Não foi possível apagar a imagem:",
                          unlinkErr.message,
                        );
                      } else {
                        console.log("Imagem apagada com sucesso");
                      }
                    });
                  }

                  return res.json({ msg: "Produto apagado com sucesso" });
                },
              );
            },
          );
        },
      );
    },
  );
});

// Adicionar produto aos favoritos
app.post("/favoritos", autenticar, (req, res) => {
  const userId = req.userId;
  const id_produto = req.body.id_produto || req.body.produto_id;

  if (!id_produto)
    return res.status(400).json({ erro: "ID do produto é obrigatório" });

  // Verificar se produto existe
  db.query(
    "SELECT id FROM produtos WHERE id = ?",
    [id_produto],
    (err, rows) => {
      if (err) return res.status(500).json({ erro: err.message });
      if (rows.length === 0)
        return res.status(404).json({ erro: "Produto não encontrado" });

      // Verificar se já está favoritado
      db.query(
        "SELECT * FROM favoritos WHERE id_produto = ? AND id_usuario = ?",
        [id_produto, userId],
        (err2, exists) => {
          if (err2) return res.status(500).json({ erro: err2.message });
          if (exists.length > 0)
            return res
              .status(400)
              .json({ erro: "Produto já está nos favoritos" });

          // guarda nos favoritos
          db.query(
            "INSERT INTO favoritos (id_produto, id_usuario) VALUES (?, ?)",
            [id_produto, userId],
            (err3) => {
              if (err3) return res.status(500).json({ erro: err3.message });
              res.json({ msg: "Produto adicionado aos favoritos!" });
            },
          );
        },
      );
    },
  );
});

// Remover produto dos favoritos
app.delete("/favoritos/:id_produto", autenticar, (req, res) => {
  const userId = req.userId;
  const id_produto = parseInt(req.params.id_produto);
  if (isNaN(id_produto))
    return res.status(400).json({ erro: "ID de produto inválido" });

  db.query(
    "DELETE FROM favoritos WHERE id_produto = ? AND id_usuario = ?",
    [id_produto, userId],
    (err, result) => {
      if (err) return res.status(500).json({ erro: err.message });
      if (result.affectedRows === 0)
        return res.status(404).json({ erro: "Favorito não encontrado" });
      res.json({ msg: "Produto removido dos favoritos!" });
    },
  );
});

// Compatibilidade para paginas que enviam o id no corpo do DELETE.
app.delete("/favoritos", autenticar, (req, res) => {
  const userId = req.userId;
  const id_produto = Number(req.body.id_produto || req.body.produto_id);

  if (!id_produto)
    return res.status(400).json({ erro: "ID de produto invalido" });

  db.query(
    "DELETE FROM favoritos WHERE id_produto = ? AND id_usuario = ?",
    [id_produto, userId],
    (err, result) => {
      if (err) return res.status(500).json({ erro: err.message });
      if (result.affectedRows === 0)
        return res.status(404).json({ erro: "Favorito nao encontrado" });
      res.json({ msg: "Produto removido dos favoritos!" });
    },
  );
});

// Listar favoritos do usuário
app.get("/favoritos", autenticar, (req, res) => {
  const userId = req.userId;
  db.query(
    "SELECT id_produto FROM favoritos WHERE id_usuario = ?",
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ erro: err.message });
      res.json(rows.map((row) => row.id_produto)); // Retorna apenas os IDs dos produtos
    },
  );
});

// Listar mensagens
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
    },
  );
});

// Mensagens de uma conversa específica
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
    },
  );
});

app.post("/mensagens", autenticar, (req, res) => {
  const remetente_id = req.userId;
  let { destinatario_id, texto, produto_id } = req.body;

  if (!destinatario_id || !texto || texto.trim() === "") {
    return res.status(400).json({
      erro: "destinatario_id e texto são obrigatórios",
    });
  }

  destinatario_id = Number(destinatario_id);
  produto_id = produto_id ? Number(produto_id) : null;

  // Verificar destinatário
  db.query(
    "SELECT id FROM usuarios WHERE id = ?",
    [destinatario_id],
    (err, rows) => {
      if (err) return res.status(500).json({ erro: err.message });
      if (!rows.length)
        return res.status(400).json({ erro: "Destinatário não encontrado" });

      // Inserir mensagem
      db.query(
        `INSERT INTO mensagens 
         (remetente_id, destinatario_id, produto_id, mensagem) 
         VALUES (?,?,?,?)`,
        [remetente_id, destinatario_id, produto_id, texto],
        (err2, result) => {
          if (err2) return res.status(500).json({ erro: err2.message });

          // Buscar mensagem + produto (se existir)
          db.query(
            `
            SELECT 
              m.id,
              m.mensagem,
              m.data_envio,
              m.remetente_id,
              m.destinatario_id,
              p.id AS produto_id,
              p.titulo,
              p.imagem_url,
              p.preco,
              u.nome AS vendedor_nome
            FROM mensagens m
            LEFT JOIN produtos p ON m.produto_id = p.id
            LEFT JOIN usuarios u ON p.vendedor = u.id
            WHERE m.id = ?
            `,
            [result.insertId],
            (err3, rows3) => {
              if (err3) return res.status(500).json({ erro: err3.message });

              res.json(rows3[0]);
            },
          );
        },
      );
    },
  );
});

// Apagar todas as mensagens entre o usuário autenticado e outro usuário
app.delete("/mensagens/conversa/:outro", autenticar, (req, res) => {
  const id = req.userId;
  const outro = parseInt(req.params.outro);
  console.log(
    `DELETE /mensagens/conversa/${req.params.outro} called by userId=${id}`,
  );
  if (isNaN(outro)) {
    console.warn('Id "outro" inválido:', req.params.outro);
    return res.status(400).json({ erro: "ID inválido" });
  }

  db.query(
    "DELETE FROM mensagens WHERE (remetente_id = ? AND destinatario_id = ?) OR (remetente_id = ? AND destinatario_id = ?)",
    [id, outro, outro, id],
    (err, result) => {
      if (err) {
        console.error("Erro ao apagar conversa:", err.message);
        return res.status(500).json({ erro: err.message });
      }
      if (!result || result.affectedRows === 0) {
        console.log(
          "Nenhuma mensagem encontrada para apagar entre",
          id,
          "e",
          outro,
        );
        return res.status(404).json({ erro: "Conversa não encontrada" });
      }
      console.log("Mensagens apagadas:", result.affectedRows);
      res.json({
        msg: "Conversa apagada com sucesso",
        deleted: result.affectedRows,
      });
    },
  );
});

app.listen(3000, () =>
  console.log("Servidor rodando em http://localhost:3000"),
);
