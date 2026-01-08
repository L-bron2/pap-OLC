async function fetchJson(url, opts = {}) {
  // Usa base absoluta para evitar problemas quando a página for aberta via file://
  const base = "http://localhost:3000";
  if (url.startsWith("/")) url = base + url;
  const token = localStorage.getItem("token");
  opts.headers = opts.headers || {};
  if (token) opts.headers["Authorization"] = "Bearer " + token;

  const res = await fetch(url, opts);
  if (!res.ok) {
    // tentar extrair mensagem JSON do servidor, cair para statusText se falhar
    try {
      const body = await res.json();
      throw new Error(body.erro || body.msg || res.statusText);
    } catch (e) {
      throw new Error(res.statusText || "Erro na requisição");
    }
  }
  return res.json();
}

function montarUserCard(u) {
  const div = document.createElement("div");
  div.className = "user-card";
  div.dataset.userid = u.id;
  div.innerHTML = `<div class="meta"><strong>${u.nome}</strong></div>
    <div class="small">${u.email || ""} • id:${u.id} • ${
    u.role || "user"
  }</div>`;
  return div;
}

async function carregarUsers() {
  const list = document.getElementById("usersList");
  list.innerHTML = "Carregando...";
  try {
    const users = await fetchJson("/usuarios");
    window._adminUsers = users;
    list.innerHTML = "";
    users.forEach((u) => list.appendChild(montarUserCard(u)));
  } catch (e) {
    mostrarAlerta(e.message || "Erro", "#ff3b30");
    document.getElementById("usersList").innerHTML = "";
  }
}

function filtrar(text) {
  const users = window._adminUsers || [];
  const q = (text || "").toLowerCase();
  const list = document.getElementById("usersList");
  list.innerHTML = "";
  users
    .filter((u) =>
      `${u.nome} ${u.email} ${u.id} ${u.role}`.toLowerCase().includes(q)
    )
    .forEach((u) => list.appendChild(montarUserCard(u)));
}

async function mostrarDetalhes(userId) {
  const detail = document.getElementById("userDetail");
  const name = document.getElementById("detailName");
  const email = document.getElementById("detailEmail");
  const role = document.getElementById("detailRole");
  const pList = document.getElementById("userProducts");
  detail.style.display = "block";
  const u = (window._adminUsers || []).find((x) => x.id == userId);
  if (!u) return;
  name.textContent = u.nome;
  name.dataset.userid = u.id;
  email.textContent = u.email;
  role.textContent = "Role: " + (u.role || "user");

  // carregar produtos e filtrar por vendedor
  pList.innerHTML = "Carregando produtos...";
  try {
    const all = await fetchJson("/produtos");
    const produtos = all.filter((p) => p.vendedor == userId);
    if (produtos.length === 0)
      pList.innerHTML = '<div class="small">Sem produtos</div>';
    else {
      pList.innerHTML = "";
      produtos.forEach((prod) => {
        const pi = document.createElement("div");
        pi.className = "product-item";
        const imgSrc =
          prod.imagem_url || "/uploads/1765534779217-210358789.avif";
        pi.innerHTML = `
          <div class="prod-left"><img class="product-thumb" src="${imgSrc}" alt=""></div>
          <div class="prod-center"><strong>${prod.titulo}</strong>
            <div class="small">id:${prod.id} • ${prod.preco || ""}€</div>
          </div>
          <div class="prod-actions"><button class="danger" data-prod="${
            prod.id
          }">Apagar</button></div>
        `;
        pList.appendChild(pi);
      });
    }
  } catch (e) {
    pList.innerHTML = "Erro ao carregar produtos";
  }

  // configurar botão apagar conta
  const btn = document.getElementById("deleteUser");
  btn.onclick = async () => {
    if (!confirm("Apagar conta e todos os dados associados?")) return;
    try {
      await fetchJson(`/usuarios/${userId}`, { method: "DELETE" });
      mostrarAlerta("Conta apagada", "#5ebb42");
      await carregarUsers();
      detail.style.display = "none";
    } catch (err) {
      mostrarAlerta(err.message || "Erro", "#ff3b30");
    }
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    mostrarAlerta("Faça login como admin", "#ff3b30");
    setTimeout(() => (location.href = "../Login/login.html"), 1200);
    return;
  }

  try {
    // verificar role do user atual
    const me = await fetchJson("/usuarios/id");
    if (me.role !== "admin") {
      mostrarAlerta("Acesso reservado a administradores", "#ff3b30");
      setTimeout(() => (location.href = "../inicio/inicio.html"), 1200);
      return;
    }
  } catch (e) {
    // mostrar a mensagem real do erro (ex: token inválido / expirado)
    try {
      mostrarAlerta(e.message || "Sessão inválida", "#ff3b30");
    } catch (e2) {
      console.error(e2);
    }
    setTimeout(() => (location.href = "../Login/login.html"), 1200);
    return;
  }

  await carregarUsers();

  document
    .getElementById("search")
    .addEventListener("input", (e) => filtrar(e.target.value));

  document.getElementById("usersList").addEventListener("click", (e) => {
    const card = e.target.closest(".user-card");
    if (!card) return;
    const id = card.dataset.userid;
    mostrarDetalhes(Number(id));
  });

  // delegação para apagar produto
  document
    .getElementById("userProducts")
    .addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-prod]");
      if (!btn) return;
      const prodId = btn.dataset.prod;
      if (!confirm("Apagar produto id:" + prodId + "?")) return;
      try {
        await fetchJson(`/produtos/${prodId}`, { method: "DELETE" });
        mostrarAlerta("Produto apagado", "#5ebb42");
        // refrescar detalhe atual
        const currentId = Number(
          document.getElementById("detailName").dataset.userid || 0
        );
        if (currentId) mostrarDetalhes(currentId);
      } catch (err) {
        mostrarAlerta(err.message || "Erro", "#ff3b30");
      }
    });
  // botão para fechar o painel de detalhe (painel direito)
  const closeBtn = document.getElementById("fecharDetalhes");
  if (closeBtn) {
    closeBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      const detail = document.getElementById("userDetail");
      if (detail) {
        detail.style.display = "none";
      }
    });
  }
});
