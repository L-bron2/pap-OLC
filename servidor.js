// -------------------- IMPORTS -------------------- //
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

// -------------------- INICIALIZAÇÃO -------------------- //
const app = express();
app.use(express.json());
app.use(cors());

// Criar pastas de uploads se não existirem
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("FTperfil")) fs.mkdirSync("FTperfil");

// -------------------- MULTER -------------------- //
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

// -------------------- CONEXÃO COM DB -------------------- //
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Erlander",
  database: "OLC",
});

db.connect((err) => {
  if (err) console.error("Erro ao conectar ao MySQL:", err.message);
  else console.log("Conectado ao MySQL (OLC)");
});

// Servir pastas de uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/FTperfil", express.static(path.join(__dirname, "FTperfil")));

// -------------------- AUTENTICAÇÃO JWT -------------------- //
function autenticar(req, res, next) {
  let token = req.headers["authorization"];
  if (!token) return res.status(403).json({ erro: "Token não fornecido" });
  if (token.startsWith("Bearer ")) token = token.slice(7);
  jwt.verify(token, "segredo", (err, decoded) => {
    if (err) return res.status(401).json({ erro: "Token inválido" });
    // armazenar id e role do token no request para uso posterior
    req.userId = decoded.id;
    req.role = decoded.role; // 'user' ou 'admin'
    next();
  });
}

// Middleware simples para autorizar apenas administradores
function autorizarAdmin(req, res, next) {
  if (req.role !== "admin")
    return res.status(403).json({ erro: "Área reservada para administradores" });
  next();
}

// -------------------- ROTAS DE RECUPERAÇÃO DA PALAVRA PASSE-------------------- //

// Verificar utilizador para recuperar senha
app.post("/recuperar/verificar", (req, res) => {
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
    }
  );
});

// Alterar palavra passe
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

// -------------------- ROTAS -------------------- //

// -------------------- Conta -------------------- //

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
    (err) => {
      if (err) return res.status(500).json({ erro: err.message });
      res.json({ msg: "Conta criada com sucesso!" });
    }
  );
});

// Apagar conta do utilizador logado/autenticado
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
              }
            );
          }
        );
      }
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
      const token = jwt.sign({ id: user.id, role: user.role }, "segredo", {
        expiresIn: "1h",
      });
      res.json({ token });
    }
  );
});

// get do usuário logado
app.get("/usuarios/id", autenticar, (req, res) => {
  // Retorna também a role para permitir verificações client-side (ex: página admin)
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
      return parsed.pathname.startsWith("/") ? parsed.pathname.slice(1) : parsed.pathname;
    } catch (e) {
      return url;
    }
  }

  // Se for pedido remover foto, buscar a foto atual e eliminar ficheiro
  if (remover_foto) {
    db.query("SELECT foto_url FROM usuarios WHERE id = ?", [userId], (err, rows) => {
      if (err) return res.status(500).json({ erro: err.message });
      const foto = rows && rows[0] ? rows[0].foto_url : null;
      if (foto) {
        const fotoPath = toLocalPath(foto);
        if (fotoPath) {
          const fullFoto = path.join(__dirname, fotoPath);
          fs.unlink(fullFoto, (unlinkErr) => {
            if (unlinkErr)
              console.warn("Aviso - Não foi possível apagar foto do utilizador:", unlinkErr.message);
          });
        }
      }

      db.query("UPDATE usuarios SET foto_url = NULL WHERE id = ?", [userId], (err2) => {
        if (err2) return res.status(500).json({ erro: err2.message });
        return res.json({ msg: "Foto removida com sucesso" });
      });
    });
    return;
  }

  // Construir query dinâmica para nome/descricao
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
    }
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
    }
  );
});

// Rota administrativa: apagar um utilizador pelo id (apaga produtos, favoritos, mensagens e imagem de perfil)
// Apenas administradores podem executar esta ação
app.delete("/usuarios/:id", autenticar, autorizarAdmin, (req, res) => {
  const targetId = parseInt(req.params.id);
  if (isNaN(targetId)) return res.status(400).json({ erro: "ID inválido" });

  // 1) Buscar produtos do utilizador para poder remover imagens e dados relacionados
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
          // se não for uma URL válida, retornar como estava
          return url;
        }
      }

      // 2) Apagar favoritos associados aos produtos
      const deleteFavsForProducts = (cb) => {
        if (!prodIds.length) return cb();
        db.query(
          "DELETE FROM favoritos WHERE id_produto IN (?)",
          [prodIds],
          (err2) => {
            if (err2) return res.status(500).json({ erro: err2.message });
            cb();
          }
        );
      };

      deleteFavsForProducts(() => {
        // 3) Apagar mensagens relacionadas a esses produtos
        const deleteMsgsForProducts = (done) => {
          if (!prodIds.length) return done();
          db.query(
            "DELETE FROM mensagens WHERE produto_id IN (?)",
            [prodIds],
            (err3) => {
              if (err3) return res.status(500).json({ erro: err3.message });
              done();
            }
          );
        };

        deleteMsgsForProducts(() => {
          // 4) Apagar os produtos em si
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
                          unlinkErr.message
                        );
                    });
                  }
                }
              });

              // 5) Apagar favoritos do próprio utilizador
              db.query(
                "DELETE FROM favoritos WHERE id_usuario = ?",
                [targetId],
                (err5) => {
                  if (err5) return res.status(500).json({ erro: err5.message });

                  // 6) Apagar mensagens em que o utilizador é remetente ou destinatário
                  db.query(
                    "DELETE FROM mensagens WHERE remetente_id = ? OR destinatario_id = ?",
                    [targetId, targetId],
                    (err6) => {
                      if (err6)
                        return res.status(500).json({ erro: err6.message });

                      // 7) Buscar foto de perfil para remover ficheiro
                      db.query(
                        "SELECT foto_url FROM usuarios WHERE id = ?",
                        [targetId],
                        (err7, rows7) => {
                          if (err7)
                            return res.status(500).json({ erro: err7.message });
                          const foto =
                            rows7 && rows7[0] ? rows7[0].foto_url : null;

                          // 8) Apagar o utilizador
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
                                    fotoPath
                                  );
                                  fs.unlink(fullFoto, (unlinkErr2) => {
                                    if (unlinkErr2)
                                      console.warn(
                                        "Aviso - Não foi possível apagar foto do utilizador:",
                                        unlinkErr2.message
                                      );
                                  });
                                }
                              }

                              return res.json({
                                msg: "Usuário apagado com sucesso",
                              });
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        });
      });
    }
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
      }
    );
  }
);

// -------------------- ROTAS DOS PRODUTOS -------------------- //

// Criar produto
app.post("/produtos", autenticar, upload.single("imagem"), (req, res) => {
  // token já validado pelo middleware `autenticar`; `req.userId` e `req.role` disponíveis
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
    }
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
    }
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
    }
  );
});

// -------------------- Apagar produto -------------------- //
// Apagar produto, apaga tudo relacionado a esse produto
app.delete("/produtos/:id", autenticar, (req, res) => {
  const prodId = parseInt(req.params.id);
  console.log(
    "DELETE /produtos/:id chamada com prodId:",
    prodId,
    "userId:",
    req.userId
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
        req.userId
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
                          unlinkErr.message
                        );
                      } else {
                        console.log("Imagem apagada com sucesso");
                      }
                    });
                  }

                  return res.json({ msg: "Produto apagado com sucesso" });
                }
              );
            }
          );
        }
      );
    }
  );
});

// -------------------- FAVORITOS -------------------- //

// Adicionar produto aos favoritos
app.post("/favoritos", autenticar, (req, res) => {
  const userId = req.userId;
  const { id_produto } = req.body;

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
            }
          );
        }
      );
    }
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
    }
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
    }
  );
});

// -------------------- MENSAGENS -------------------- //
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
    }
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
    }
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
            }
          );
        }
      );
    }
  );
});

// Apagar todas as mensagens entre o usuário autenticado e outro usuário
app.delete("/mensagens/conversa/:outro", autenticar, (req, res) => {
  const id = req.userId;
  const outro = parseInt(req.params.outro);
  console.log(
    `DELETE /mensagens/conversa/${req.params.outro} called by userId=${id}`
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
          outro
        );
        return res.status(404).json({ erro: "Conversa não encontrada" });
      }
      console.log("Mensagens apagadas:", result.affectedRows);
      res.json({
        msg: "Conversa apagada com sucesso",
        deleted: result.affectedRows,
      });
    }
  );
});

// -------------------- SERVIDOR -------------------- //
app.listen(3000, () =>
  console.log("Servidor rodando em http://localhost:3000")
);
