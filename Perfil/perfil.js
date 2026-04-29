const token = localStorage.getItem("token");

// Verificar se existe token
if (!token) {
  window.location.href = "../Login/login.html";
}

// Carregar dados do utilizador
async function carregarPerfil() {
  try {
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch("http://localhost:3000/usuarios/id", {
      headers,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.erro || "Erro ao carregar os dados.");
    }

    const usuarios = await response.json();
    const div = document.getElementById("usuarios");
    if (!div) throw new Error("Elemento #usuarios não encontrado no DOM");
    div.innerHTML = "";

    const lista = Array.isArray(usuarios) ? usuarios : [usuarios];

    const usuario = lista[0];
    if (!usuario) {
      mostrarAlerta("Utilizador não encontrado", "#ff3b30");
      return;
    }

    const foto = usuario.foto_url || "../imagens/default.png";
    const nome = usuario.nome || "";
    const email = usuario.email || "";
    const descricao = usuario.descricao || usuario.bio || "";
    const dataRaw = usuario.data_publicacao;
    let dataFmt = "-";
    try {
      if (dataRaw) dataFmt = new Date(dataRaw).toLocaleDateString();
    } catch {}

    // card utilizador
    const profileCard = document.getElementById("profileCard");
    if (profileCard) {
      profileCard.innerHTML = `
                <div class="avatar"><img id="avatarImg" src="${foto}" alt=""></div>
                <div class="username-row">
                    <div class="username">${nome}</div>
                    <button class="editNome" id="EditNome" type="button" title="Alterar nome">
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                </div>
                <div class="user-email">${email}</div>
                <div class="user-since">Desde: ${dataFmt}</div>
                <div class="edit-actions">
                    <button id="btnEditar" class="btn btn-edit">Editar bio</button>
                    <button id="btnAtualizarFoto" class="btn" style="background:var(--cor-roxo);color:#fff">Atualizar foto</button>
                    <button id="btnRemoverFoto" class="btn btn-remove" style="background:#999;color:#fff">Remover foto</button>
                    <button id="btnSair" class="btn btn-logout">Sair</button>
                </div>
            `;

      // input file escondido para atualizar foto
      const inputImagem = document.createElement("input");
      inputImagem.type = "file";
      inputImagem.id = "imagem";
      inputImagem.name = "imagem";
      inputImagem.accept = "image/*";
      inputImagem.style.display = "none";
      profileCard.appendChild(inputImagem);
    }

    // O botao de editar nome 
    const editarNome = document.getElementById("EditNome");

    // editar nome
    if (editarNome) {
      editarNome.addEventListener("click", async () => {
        const novoNome = prompt("Digite o novo nome:", nome);
        if (novoNome && novoNome.trim() !== "") {
          try {
            const resp = await fetch("http://localhost:3000/usuarios", {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ nome: novoNome.trim() }),
            });
            if (resp.ok) {
              mostrarAlerta("Nome atualizado com sucesso!", "#4BB543");
              // Atualizar nome no DOM
              const usernameDiv = document.querySelector(".username");
              if (usernameDiv) usernameDiv.innerText = novoNome.trim();
            } else {
              const txt = await resp.text().catch(() => "");
              mostrarAlerta("Falha ao atualizar nome: " + txt, "#ff3b30");
            }
          } catch (err) {
            mostrarAlerta("Erro de conexão: " + err.message, "#ff3b30");
          }
        }
      });
    }

    // detalhes / bio
    div.innerHTML = `
            <div class="section-title">Informações</div>
            <p class="bio" id="bioText">${
              descricao ? descricao : "Adicione uma descrição sobre si mesmo."
            }</p>
            <div class="infoUtilizador"></div>
        `;

    // container para os produtos do utilizador
    const areaProduto = document.createElement("div");
    areaProduto.className = "produtos-section";
    areaProduto.innerHTML = `
            <div class="section-title">Meus produtos</div>
            <div class="produtos-grid" id="meusProdutos"></div>
        `;
    div.appendChild(areaProduto);

    // buscar todos os produtos do utilizador
    try {
      const resp = await fetch("http://localhost:3000/meuProdutos", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      if (resp.ok) {
        const meus = await resp.json();
        const grid = document.getElementById("meusProdutos");
        if (grid) {
          grid.innerHTML = "";
          // verifica se existem produtos
          if (Array.isArray(meus) && meus.length > 0) {
            // listar cada produto
            meus.forEach((produto) => {
              // card dos teus produtos
              const card = document.createElement("div");
              card.className = "produto-card";
              card.innerHTML = `
                <img src="${
                  produto.imagem_url || "../imagens/default.png"
                }" alt=""> 
                <div class="produto-titulo">${produto.titulo}</div>
                <div class="produto-preco">${produto.preco}€</div>
              `;

              // botão para apagar produto
              const btnApagar = document.createElement("button");
              btnApagar.className = "btn btn-delete";
              btnApagar.style.marginTop = "8px";
              btnApagar.style.background = "#ff3b30";
              btnApagar.style.color = "#fff";
              btnApagar.innerText = "Apagar";
              btnApagar.addEventListener("click", async (e) => {
                e.stopPropagation();
                const confirmar = await confirmarAcao({
                  titulo: "Apagar produto?",
                  mensagem: `Deseja apagar o produto "${produto.titulo}"? Esta acao e irreversivel.`,
                  confirmarTexto: "Apagar produto",
                });
                if (!confirmar) {
                  mostrarAlerta("Ação cancelada", "#ffb84d");
                  return;
                }

                try {
                  console.log(
                    "Deletando produto:",
                    produto.id,
                    "Token:",
                    token ? "OK" : "MISSING"
                  );
                  const resp = await fetch(
                    `http://localhost:3000/produtos/${produto.id}`,
                    {
                      method: "DELETE",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                    }
                  );

                  // Ler resposta como texto primeiro
                  const texto = await resp.text();
                  console.log(
                    "Resposta do servidor (status:",
                    resp.status,
                    "):",
                    texto
                  );

                  let body = {};
                  try {
                    body = JSON.parse(texto);
                  } catch (e) {
                    console.error(
                      "Erro ao parsear JSON:",
                      e.message,
                      "Texto recebido:",
                      texto
                    );
                    mostrarAlerta("resposta inválida do servidor", "#ff3b30");
                    return;
                  }

                  if (!resp.ok) {
                    mostrarAlerta(
                      "Erro: " +
                        (body.erro ||
                          body.msg ||
                          `Falha ao apagar produto (${resp.status})`),
                      "#ff3b30"
                    );
                    return;
                  }

                  mostrarAlerta("Produto apagado com sucesso!", "#4BB543");
                  card.remove();
                } catch (err) {
                  console.error("Erro de rede:", err);
                  mostrarAlerta("Erro de conexão: " + err.message, "#ff3b30");
                }
              });

              card.appendChild(btnApagar);
              grid.appendChild(card);
            });
          } else {
            // se não tiver produtos
            grid.innerHTML = "<p>Sem produtos.</p>";
            const criarProduto = document.createElement("button");
            criarProduto.innerText = "Criar Produto";
            criarProduto.className = "btn btn-criar-produto";
            criarProduto.addEventListener("click", () => {
              window.location.href = "../produtos/novo_produto.html";
            });
            grid.appendChild(criarProduto);
          }
        }
      } else {
        console.warn("Falha ao carregar produtos:", resp.status);
      }
    } catch (err) {
      console.error("Erro ao buscar produtos:", err);
    }

    // botao sair
    const btnSair = document.getElementById("btnSair");
    if (btnSair) {
      btnSair.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "../Login/login.html";
      });
    }

    // Botão apagar conta 
    const apagarContaEl = document.getElementById("apagarConta");
    let apagarContaBtn = null;
    if (apagarContaEl) {
      if (apagarContaEl.tagName === "BUTTON") apagarContaBtn = apagarContaEl;
      else apagarContaBtn = apagarContaEl.querySelector("button") || apagarContaEl;
    }
    if (apagarContaBtn) {
      apagarContaBtn.addEventListener("click", async () => {
        const confirmar = await confirmarAcao({
          titulo: "Apagar conta?",
          mensagem: "Esta acao e irreversivel e vai remover os seus produtos, mensagens, favoritos e a conta permanentemente.",
          confirmarTexto: "Apagar conta",
        });
        if (!confirmar) {
          mostrarAlerta("Ação cancelada", "#ffb84d");
          return;
        }

        try {
          const response = await fetch("http://localhost:3000/apagarConta", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          const data = await response.json();

          if (!response.ok) {
            mostrarAlerta(
              "Erro: " + (data.erro || "Falha ao apagar conta"),
              "#ff3b30"
            );
            return;
          }

          mostrarAlerta(
            "Conta apagada com sucesso! A redirecionar...",
            "#4caf50"
          );
          setTimeout(() => {
            localStorage.removeItem("token");
            window.location.href = "../inicio/inicio.html";
          }, 2000);
        } catch (err) {
          mostrarAlerta("Erro de conexão: " + err.message, "#ff3b30");
        }
      });
    }

    //atualizar foto
    const btnAtualizarFoto = document.getElementById("btnAtualizarFoto");
    const btnRemoverFoto = document.getElementById("btnRemoverFoto");
    const inputFile = document.getElementById("imagem");
    if (btnAtualizarFoto && inputFile) {
      // quando clicar abre o explorador
      btnAtualizarFoto.addEventListener("click", () => inputFile.click());

      // enviar automaticamente a foto
      inputFile.addEventListener("change", async () => {
        const arquivo = inputFile.files[0];
        if (!arquivo) return;
        if (!arquivo.type.startsWith("image/")) {
          mostrarAlerta("O arquivo selecionado não é uma imagem.", "#ff3b30");
          return;
        }

        const formulario = new FormData();
        formulario.append("imagem", arquivo);

        try {
          const resposta = await fetch("http://localhost:3000/usuarios/foto", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formulario,
          });

          let resultado = {};
          try {
            resultado = await resposta.json();
          } catch (e) {}

          if (resposta.ok) {
            mostrarAlerta(
              resultado.msg || "Foto atualizada com sucesso!",
              "#4BB543"
            );
            const avatarImg = document.getElementById("avatarImg");
            if (avatarImg && resultado.foto_url) avatarImg.src = resultado.foto_url;
          } else {
            mostrarAlerta(resultado.erro || "Erro ao atualizar foto.", "#ff3b30");
          }
        } catch (err) {
          mostrarAlerta("Erro de conexão: " + err.message, "#ff3b30");
        }
      });
    }

    // remover foto
    if (btnRemoverFoto) {
      btnRemoverFoto.addEventListener("click", async () => {
        const confirmar = await confirmarAcao({
          titulo: "Remover foto?",
          mensagem: "Deseja remover a sua foto de perfil?",
          confirmarTexto: "Remover foto",
        });
        if (!confirmar) return;
        try {
          const resp = await fetch("http://localhost:3000/usuarios", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ remover_foto: true }),
          });
          const data = await resp.json().catch(() => ({}));
          if (resp.ok) {
            mostrarAlerta(data.msg || "Foto removida", "#4BB543");
            const avatarImg = document.getElementById("avatarImg");
            if (avatarImg) avatarImg.src = "../imagens/default.png";
          } else {
            mostrarAlerta(data.erro || "Erro ao remover foto.", "#ff3b30");
          }
        } catch (err) {
          mostrarAlerta("Erro de conexão: " + err.message, "#ff3b30");
        }
      });
    }

    // Editar bio
    const btnEditar = document.getElementById("btnEditar");
    if (btnEditar) {
      btnEditar.addEventListener("click", () => {
        if (document.getElementById("editArea")) return;

        const bioText = document.getElementById("bioText");
        const textoAtual = bioText ? bioText.innerText : "";

        const area = document.createElement("div");
        area.id = "editArea";
        area.className = "edit-area";
        area.innerHTML = `
                    <textarea id="descricaoInput" placeholder="Escreva algo sobre si...">${
                      textoAtual === "Adicione uma descrição sobre si mesmo."
                        ? ""
                        : textoAtual
                    }</textarea>
                    <div class="save-cancel">
                        <button id="btnSaveDesc" class="btn btn-save">Guardar</button>
                        <button id="btnCancelDesc" class="btn btn-cancel">Cancelar</button>
                    </div>
                `;

        const detalhes = document.querySelector(".profile-details");
        if (detalhes) detalhes.appendChild(area);
        else if (profileCard) profileCard.appendChild(area);
        else div.appendChild(area);

        const btnCancelar = document.getElementById("btnCancelDesc");
        const btnGuardar = document.getElementById("btnSaveDesc");

        if (btnCancelar) {
          btnCancelar.addEventListener("click", () => {
            area.remove();
          });
        }

        if (btnGuardar) {
          btnGuardar.addEventListener("click", async () => {
            const novoTexto = document.getElementById("descricaoInput").value.trim();
            // Atualizar DOM
            if (bioText) bioText.innerText = novoTexto || "Adicione uma descrição sobre si mesmo.";
            area.remove();

            try {
              const resp = await fetch("http://localhost:3000/usuarios", {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ descricao: novoTexto }),
              });
              if (resp.ok) {
                mostrarAlerta("Descrição atualizada com sucesso!", "#4BB543");
              } else {
                mostrarAlerta("Descrição atualizada com sucesso!.", "#4bb543");
              }
            } catch (err) {
              mostrarAlerta(
                "Não foi possível guardar no servidor. Atualizado localmente.",
                "#ffb84d"
              );
            }
          });
        }
      });
    }
  } catch (error) {
    console.error("Perfil error:", error);
    mostrarAlerta(error.message || "Erro ao carregar dados.", "#ff3b30");
  }
}

window.onload = function () {
  carregarPerfil();
};
