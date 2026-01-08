function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

//verifica se o utilizador esta logado e se tiver pode enviar mensagens
window.onload = async function () {
  const areaAdmin = document.getElementById("area_admin");
  const token = localStorage.getItem("token");
  if (!token) {
    mostrarAlerta("Faça login para poder acessar a essa página!");
    return setTimeout(
      () => (window.location.href = "../Login/login.html"),
      1500
    );
  }
  // admin visibility handled by shared/admin-link.js; do not inspect token string here

  const listaConversas = document.getElementById("listaConversas");
  const chatMensagens = document.getElementById("chatMensagens");
  const chatUserName = document.getElementById("chatUserName");
  const inputMensagem = document.getElementById("inputMensagem");
  const btnEnviar = document.getElementById("btnEnviar");

  let conversaAtiva = null;

  //verifica o id do utilizador a partir do token
  function getUserId() {
    try {
      return JSON.parse(atob(token.split(".")[1])).id;
    } catch {
      mostrarAlerta("Token inválido");
      return null;
    }
  }

  async function carregarConversas() {
    try {
      const r = await fetch("http://localhost:3000/mensagens", {
        headers: { Authorization: "Bearer " + token },
      });
      if (!r.ok) throw new Error("Falha ao carregar conversas");
      const msgs = await r.json();
      listaConversas.innerHTML = "";
      const grupos = {};

      msgs.forEach((m) => {
        const outro =
          m.remetente_id === getUserId() ? m.destinatario_id : m.remetente_id;
        if (!grupos[outro]) grupos[outro] = [];
        grupos[outro].push(m);
      });

      const entradas = Object.keys(grupos)
        .map((uid) => {
          const ult = grupos[uid][0];
          const nome =
            ult.remetente_id == uid
              ? ult.remetente_nome
              : ult.destinatario_nome;
          return {
            uid,
            nome,
            ultimo: ult.mensagem || "",
            data: new Date(ult.data_envio).getTime(),
          };
        })
        .sort((a, b) => b.data - a.data);

      entradas.forEach((e) =>
        atualizarOuCriarConversa(e.uid, e.nome, e.ultimo)
      );
    } catch (err) {
      mostrarAlerta(err.message);
    }
  }

  function atualizarOuCriarConversa(outroId, nome, ultimo) {
    const key = String(outroId);
    let existente = listaConversas.querySelector(`[data-uid="${key}"]`);

    if (!existente) {
      existente = document.createElement("div");
      existente.className = "conversa-item";
      existente.dataset.uid = key;
      listaConversas.insertBefore(existente, listaConversas.firstChild);
    }

    existente.innerHTML = `
      <button class="apagar-btn" title="Apagar conversa">×</button>
      <div class="meta">
        <div class="nome">${nome || "Sem nome"}</div>
        <div class="ultimo">${(ultimo || "").slice(0, 40)}</div>
      </div>
    `;

    // ligar o botão de apagar (impede propagação para não abrir a conversa)
    const delBtn = existente.querySelector(".apagar-btn");
    if (delBtn) {
      delBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (
          !confirm(
            "Apagar todas as mensagens desta conversa? Esta ação é irreversível."
          )
        )
          return;
        try {
          const r = await fetch(
            `http://localhost:3000/mensagens/conversa/${outroId}`,
            {
              method: "DELETE",
              headers: { Authorization: "Bearer " + token },
            }
          );
          const body = await r.json().catch(() => ({}));
          if (!r.ok) {
            console.error("DELETE conversa failed", r.status, body);
            return mostrarAlerta(
              `${body.erro || body.msg || "Falha ao apagar conversa"} (status ${
                r.status
              })`
            );
          }

          console.log("DELETE conversa success", body);
          mostrarAlerta(body.msg || "Conversa apagada com sucesso", "#00cc66");

          // se a conversa apagada estava ativa, limpar área
          if (conversaAtiva === Number(outroId)) {
            conversaAtiva = null;
            chatUserName.textContent = "Selecione uma conversa";
            chatMensagens.innerHTML =
              '<p class="placeholder">Sem mensagens</p>';
          }

          // remover item da lista
          existente.remove();
          carregarConversas();
        } catch (err) {
          mostrarAlerta(err.message || String(err));
        }
      });
    }

    existente.onclick = () => abrirConversa(outroId, nome);
    listaConversas
      .querySelectorAll(".conversa-item")
      .forEach((it) => it.classList.remove("ativa"));
    existente.classList.add("ativa");
  }

  function garantirConversa(outroId, nome) {
    if (!outroId) return;
    const key = String(outroId);
    if (listaConversas.querySelector(`[data-uid="${key}"]`)) return;

    const div = document.createElement("div");
    div.className = "conversa-item";
    div.dataset.uid = key;
    listaConversas.insertBefore(div, listaConversas.firstChild);

    atualizarOuCriarConversa(
      outroId,
      nome || "Vendedor",
      "Sem mensagens ainda"
    );
  }

  async function abrirConversa(outroId, nome) {
    conversaAtiva = Number(outroId);
    if (isNaN(conversaAtiva)) return mostrarAlerta("ID da conversa inválido");
    chatUserName.textContent = nome;
    garantirConversa(outroId, nome);
    listaConversas
      .querySelectorAll(".conversa-item")
      .forEach((it) => it.classList.remove("ativa"));
    const atual = listaConversas.querySelector(
      `[data-uid="${String(outroId)}"]`
    );
    if (atual) atual.classList.add("ativa");
    carregarMensagensConversa();
  }

  async function carregarMensagensConversa() {
    if (!conversaAtiva) return;

    try {
      const r = await fetch(
        `http://localhost:3000/mensagens/conversa/${conversaAtiva}`,
        {
          headers: { Authorization: "Bearer " + token },
        }
      );
      if (!r.ok) throw new Error("Falha ao carregar mensagens");
      const msgs = await r.json();
      chatMensagens.innerHTML = "";

      if (!msgs || msgs.length === 0) {
        chatMensagens.innerHTML =
          '<p class="placeholder">Sem mensagens ainda. Envie a primeira.</p>';
        return;
      }

      msgs.forEach((m) => {
        const div = document.createElement("div");
        div.className =
          "mensagem " + (m.remetente_id === getUserId() ? "me" : "their");
        div.textContent = m.mensagem;

        const horaDiv = document.createElement("div");
        horaDiv.className = "hora";
        horaDiv.textContent = new Date(m.data_envio).toLocaleString();

        div.appendChild(horaDiv);
        chatMensagens.appendChild(div);
      });

      chatMensagens.scrollTop = chatMensagens.scrollHeight;
    } catch (err) {
      mostrarAlerta(err.message);
    }
  }

  btnEnviar.onclick = async () => {
    const texto = inputMensagem.value.trim();
    if (!texto || !conversaAtiva)
      return mostrarAlerta("Selecione uma conversa para enviar essa mensagem.");

    const destinatario = Number(conversaAtiva);
    if (isNaN(destinatario))
      return mostrarAlerta("ID do destinatário inválido");

    const produtoQuery = getQueryParam("produto");
    const produto_id = produtoQuery ? Number(produtoQuery) : null;

    try {
      const r = await fetch("http://localhost:3000/mensagens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          destinatario_id: destinatario,
          texto,
          produto_id,
        }),
      });

      if (!r.ok) {
        const body = await r.json().catch(() => null);
        throw new Error(body?.erro || "Falha ao enviar mensagem");
      }

      inputMensagem.value = "";
      carregarMensagensConversa();
      carregarConversas();
    } catch (err) {
      mostrarAlerta(err.message || String(err));
    }
  };

  inputMensagem.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      btnEnviar.click();
    }
  });

  carregarConversas();
  setInterval(carregarConversas, 6000);

  const vendedorQuery = getQueryParam("vendedor");
  const nomeQuery = getQueryParam("nome");
  const produtoTituloParam = getQueryParam("titulo");
  const produtoPrecoParam = getQueryParam("preco");
  const produtoImgParam = getQueryParam("img");

  function showProductPreview(titulo, preco, img) {
    if (!titulo && !preco && !img) return;
    const tituloTxt = titulo || "";
    const precoTxt = preco || "";
    const imgUrl = img || "";

    // preencher input com mensagem padrão
    try {
      inputMensagem.value =
        tituloTxt || precoTxt
          ? `Olá, tenho interesse no seu produto "${tituloTxt}" ${
              precoTxt ? `- ${precoTxt}€` : ""
            }.`
          : "Olá, gostaria de falar sobre um produto seu.";
    } catch (e) {
      console.warn("Erro ao preencher inputMensagem", e);
    }

    // criar preview se não existir
    if (!document.querySelector(".produto-preview")) {
      const preview = document.createElement("div");
      preview.className = "produto-preview";
      preview.innerHTML = `
        <div class="preview-imagem">${
          imgUrl ? `<img src="${imgUrl}" alt="${tituloTxt}"/>` : ""
        }</div>
        <div class="preview-info">
          <div class="preview-titulo">${tituloTxt}</div>
          <div class="preview-preco">${precoTxt ? precoTxt + "€" : ""}</div>
        </div>
        <button class="preview-close" title="Remover">×</button>
      `;
      const chatArea = document.querySelector(".chat-area");
      if (chatArea) {
        const msgs = chatArea.querySelector(".chat-mensagens");
        chatArea.insertBefore(preview, msgs);
        const close = preview.querySelector(".preview-close");
        if (close) close.addEventListener("click", () => preview.remove());
      }
    }
  }
  if (vendedorQuery) {
    if (nomeQuery) {
      abrirConversa(vendedorQuery, decodeURIComponent(nomeQuery));
      showProductPreview(
        produtoTituloParam ? decodeURIComponent(produtoTituloParam) : null,
        produtoPrecoParam ? decodeURIComponent(produtoPrecoParam) : null,
        produtoImgParam ? decodeURIComponent(produtoImgParam) : null
      );
    } else {
      fetch(
        `http://localhost:3000/usuarios/${encodeURIComponent(vendedorQuery)}`
      )
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data) => abrirConversa(vendedorQuery, data.nome || "Vendedor"))
        .catch(() => abrirConversa(vendedorQuery, "Vendedor"));
    }
  }
};
