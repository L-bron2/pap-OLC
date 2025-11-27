function mostrarAlerta(mensagem, cor = "#ff3b30", icone = "") {
  const alerta = document.getElementById("alerta");
  alerta.innerHTML = `
        <span style="font-size:1.3em;margin-right:8px;">${icone}</span>
        ${mensagem}
        <button class="fechar" onclick="this.parentElement.style.display='none'">&times;</button>
    `;
  alerta.style.background = cor;
  alerta.classList.add("mostrar");
  alerta.style.display = "block";

  setTimeout(() => {
    alerta.classList.remove("mostrar");
    alerta.style.display = "none";
  }, 3000);
}

function pesquisar() {
  const input = document.getElementById("pesquisar").value.toLowerCase();
  const produtos = document.getElementsByClassName("produto");

  for (let i = 0; i < produtos.length; i++) {
    const titulo = produtos[i].querySelector("h3");
    produtos[i].style.display =
      titulo && titulo.textContent.toLowerCase().includes(input)
        ? "flex"
        : "none";
  }
}

window.onload = function () {
  const produtosContainer = document.getElementById("produtos-container");
  const modal = document.getElementById("caixaFlutuante");
  const fechar = document.getElementById("fechar");

  const modalNome = document.getElementById("nome");
  const modalDescricao = document.getElementById("descricao");
  const modalVendedor = document.getElementById("vendedor");
  const modalBTN = document.getElementById("BTN");
  const modalImagem = document.getElementById("modalImagem");
  const modalPreco = document.getElementById("Preco");

  const token = localStorage.getItem("token");
  let favoritosList = [];

  // Carrega a lista de faritoss 
  if (token) {
    fetch("http://localhost:3000/favoritos", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((ids) => {
        favoritosList = ids || [];
      })
      .catch((err) => console.error("Não foi possível carregar favoritos:", err));
  }

  fetch("http://localhost:3000/produtos")
    .then((res) => res.json())
    .then((produtos) => {
      produtosContainer.innerHTML = "";

      produtos.forEach((produto) => {
        const div = document.createElement("div");
        div.classList.add("produto");
        div.style.position = "relative";

        const isFav = favoritosList.includes(produto.id);

        div.innerHTML = `
          <button class="favoritoBTN" style="position: absolute; top: 5px; right: 8px; background: white; border: none; cursor: pointer; padding: 5px; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.2); z-index: 10;">
            <span class="material-symbols-outlined" style="font-size: 24px; color: ${isFav ? "#fa6db3" : "#999"};">
              ${isFav ? "favorite" : "favorite_border"}
            </span>
          </button>
          <h3>${produto.titulo}</h3>
          <img src="http://localhost:3000${produto.imagem_url || ""}" alt="${produto.titulo}">
          <p>${produto.descricao}</p>
          <p><strong>Preço:</strong> ${produto.preco}€</p>
          <p><strong>Categoria:</strong> ${produto.categoria}</p>
          <p><strong>Data:</strong> ${new Date(produto.data_publicacao).toLocaleDateString()}</p>
        `;

        const favoritoBTN = div.querySelector(".favoritoBTN");
        const span = favoritoBTN.querySelector("span");

        favoritoBTN.onclick = (e) => {
          e.stopPropagation();
          if (!token) {
            mostrarAlerta("Faça login para adicionar favoritos", "#ff3b30");
            return;
          }

          const isFavorited = favoritosList.includes(produto.id);
          const method = isFavorited ? "DELETE" : "POST";
          const url = isFavorited
            ? `http://localhost:3000/favoritos/${produto.id}`
            : "http://localhost:3000/favoritos";

          const options = {
            method: method,
            headers: { Authorization: "Bearer " + token },
          };

          if (method === "POST") {
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify({ id_produto: produto.id });
          }

          fetch(url, options)
            .then((res) => res.json())
            .then((data) => {
              const novoEstado = !isFavorited;
              if (novoEstado) {
                span.textContent = "favorite";
                span.style.color = "#f50f0fff";
                favoritosList.push(produto.id);
              } else {
                span.textContent = "favorite_border";
                span.style.color = "#999";
                favoritosList = favoritosList.filter((id) => id !== produto.id);
              }
              const msg = isFavorited
                ? `${produto.titulo} removido dos favoritos!`
                : `${produto.titulo} adicionado aos favoritos!`;
              mostrarAlerta(msg, isFavorited ? "#ff9500" : "#5ebb42ff");
            })
            .catch((err) => {
              mostrarAlerta("Erro ao atualizar favorito", "#ff3b30");
              console.error(err);
            });
        };

        div.addEventListener("click", (e) => {
          // Não abrir modal se clicar no botão de favorito
          if (e.target.closest(".favoritoBTN")) return;

          modal.style.display = "flex";

          modalNome.textContent = produto.titulo;
          modalDescricao.textContent = produto.descricao;
          modalVendedor.textContent = `Vendedor: ${produto.usuario_nome || "Vendedor"}`;
          modalImagem.src = produto.imagem_url
            ? `http://localhost:3000${produto.imagem_url}`
            : "";
          modalImagem.alt = produto.titulo || "Imagem do produto";
          modalPreco.textContent = produto.preco ? `Preço: ${produto.preco}€` : "";

          const vendedorId = produto.vendedor; 

          if (!vendedorId) {
            return mostrarAlerta("Vendedor não encontrado", "#ff3b30");
          }

          modalBTN.onclick = () => {
            const produtoId = produto.id;

            mostrarAlerta(
              `Abrindo conversa com ${produto.usuario_nome || "Vendedor"}...`,
              "#00cc66"
            );

            const url = `../conversas/chat.html?vendedor=${encodeURIComponent(
              vendedorId
            )}&produto=${encodeURIComponent(
              produtoId
            )}&nome=${encodeURIComponent(produto.usuario_nome || "Vendedor")}`;

            window.location.href = url;
          };
        });

        produtosContainer.appendChild(div);
      });
    })
    .catch((err) => {
      console.error(err);
      mostrarAlerta("Erro ao carregar produtos.", "#ff3b30");
    });

  fechar.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
};
