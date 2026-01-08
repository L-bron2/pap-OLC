window.onload = async function () {
  const token = localStorage.getItem("token");
  const favoritosContainer = document.getElementById("favoritos-container");
  const modal = document.getElementById("caixaFlutuante");
  const fechar = document.getElementById("fechar");

  const modalNome = document.getElementById("nome");
  const modalDescricao = document.getElementById("descricao");
  const modalVendedor = document.getElementById("vendedor");
  const modalBTN = document.getElementById("BTN");
  const modalImagem = document.getElementById("modalImagem");
  const modalPreco = document.getElementById("Preco");
  const areaAdmin = document.getElementById("area_admin");

  if (!token) {
    mostrarAlerta("Faça login para ver seus favoritos", "#ff3b30");
    setTimeout(() => (window.location.href = "../Login/login.html"), 1500);
    return;
  }

  // visibility of admin area is handled by shared/admin-link.js

  try {
    // pega os favoritos
    const resFavoritos = await fetch("http://localhost:3000/favoritos", {
      headers: { Authorization: "Bearer " + token },
    });

    if (!resFavoritos.ok) throw new Error("Erro ao carregar favoritos");

    const favoritoIds = await resFavoritos.json();

    if (favoritoIds.length === 0) {
      favoritosContainer.innerHTML = `
        <div class="mensagem-vazia" style="grid-column: 1 / -1;">
          <h2>Nenhum favorito adicionado</h2>
          <p>Adicione produtos aos seus favoritos para vê-los aqui.</p>
          <a href="../inicio/inicio.html">Ir para produtos</a>
        </div>
      `;
      return;
    }

    // pegar todos os produtos
    const resProdutos = await fetch("http://localhost:3000/produtos");
    if (!resProdutos.ok) throw new Error("Erro ao carregar produtos");

    const todos = await resProdutos.json();

    // transformar ids para número
    const favoritoIdsNum = favoritoIds.map((id) => Number(id));

    // filtrar apenas os que tão marcados como favoritos
    const produtosFav = todos.filter((p) => favoritoIdsNum.includes(p.id));

    if (produtosFav.length === 0) {
      favoritosContainer.innerHTML = `
        <div class="mensagem-vazia" style="grid-column: 1 / -1;">
          <h2>Favoritos não encontrados</h2>
          <p>Os produtos nos seus favoritos podem ter sido removidos.</p>
          <a href="../inicio/inicio.html">Ir para produtos</a>
        </div>
      `;
      return;
    }

    // limpar container
    favoritosContainer.innerHTML = "";

    // cards dos favoritos
    produtosFav.forEach((produto) => {
      const card = document.createElement("div");
      card.className = "favorito-card";

      const imgSrc = produto.imagem_url
        ? `http://localhost:3000${produto.imagem_url}`
        : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='200'%3E%3Crect fill='%23ddd' width='250' height='200'/%3E%3C/svg%3E";

      card.innerHTML = `
        <img src="${imgSrc}" alt="${produto.titulo}" class="favorito-imagem">
        <div class="favorito-info">
          <h3 class="favorito-titulo">${produto.titulo}</h3>
          <div class="favorito-preco">${produto.preco}€</div>
          <p class="favorito-descricao">${produto.descricao}</p>
          <p class="favorito-vendedor">
            <strong>Vendedor:</strong> ${produto.usuario_nome || "Desconhecido"}
          </p>
          <div class="favorito-acoes">
            <button class="btn-remover" data-id="${
              produto.id
            }">Remover dos Favoritos</button>
          </div>
        </div>
      `;

      // abrir modal ao clicar no card
      card.addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-remover")) return;

        modal.style.display = "flex";

        modalNome.textContent = produto.titulo;
        modalDescricao.textContent = produto.descricao;
        modalVendedor.textContent = `Vendedor: ${
          produto.usuario_nome || "Vendedor"
        }`;
        modalImagem.src = produto.imagem_url
          ? `http://localhost:3000${produto.imagem_url}`
          : "";
        modalPreco.textContent = produto.preco
          ? `Preço: ${produto.preco}€`
          : "";

        const vendedorId = produto.vendedor;

        modalBTN.onclick = () => {
          const url = `../conversas/chat.html?vendedor=${vendedorId}&produto=${
            produto.id
          }&nome=${encodeURIComponent(produto.usuario_nome || "Vendedor")}`;
          window.location.href = url;
        };
      });

      // remover favorito
      card.querySelector(".btn-remover").onclick = async (e) => {
        e.stopPropagation();
        const idProduto = Number(e.target.dataset.id);

        try {
          const res = await fetch(
            `http://localhost:3000/favoritos/${idProduto}`,
            {
              method: "DELETE",
              headers: {
                Authorization: "Bearer " + token,
                "Content-Type": "application/json",
              },
            }
          );

          if (!res.ok) throw new Error("Erro ao remover favorito");

          mostrarAlerta(`${produto.titulo} removido dos favoritos!`, "#ff9500");

          card.style.opacity = "0";
          setTimeout(() => card.remove(), 300);

          if (favoritosContainer.children.length === 0) {
            favoritosContainer.innerHTML = `
              <div class="mensagem-vazia" style="grid-column: 1 / -1;">
                <h2>Nenhum favorito adicionado</h2>
                <p>Adicione produtos aos seus favoritos para vê-los aqui.</p>
                <a href="../inicio/inicio.html">Ir para produtos</a>
              </div>
            `;
          }
        } catch (err) {
          mostrarAlerta("Erro ao remover favorito", "#ff3b30");
          console.error(err);
        }
      };

      favoritosContainer.appendChild(card);
    });

    // Fechar modal
    fechar.onclick = () => (modal.style.display = "none");
  } catch (err) {
    mostrarAlerta(err.message, "#ff3b30");
    console.error(err);
  }
};
