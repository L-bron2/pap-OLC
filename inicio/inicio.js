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

async function carregarCategorias(selectId) {
  try {
    const res = await fetch("http://localhost:3000/categorias");
    if (!res.ok) throw new Error("Erro ao obter categorias");

    const categorias = await res.json();
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = "<option value=''>Todas</option>";

    categorias.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.categoria;
      option.textContent = cat.categoria;
      select.appendChild(option);
    });
  } catch (err) {
    console.error(err);
    mostrarAlerta("Erro ao carregar categorias.", "#ff3b30");
  }
}

window.onload = async function () {
  const produtosContainer = document.getElementById("produtos-container");
  const modal = document.getElementById("caixaFlutuante");
  const fechar = document.getElementById("fechar");

  const modalNome = document.getElementById("nome");
  const modalDescricao = document.getElementById("descricao");
  const modalVendedor = document.getElementById("vendedor");
  const modalBTN = document.getElementById("BTN");
  const modalImagem = document.getElementById("modalImagem");
  const modalPreco = document.getElementById("Preco");
  const filtro = document.getElementById("filtro");
  const areaAdmin = document.getElementById("area_admin");

  const token = localStorage.getItem("token");
  let favoritosList = [];

  /* ================= FAVORITOS ================= */
  if (token) {
    try {
      const resFav = await fetch("http://localhost:3000/favoritos", {
        headers: { Authorization: "Bearer " + token },
      });
      const ids = await resFav.json();
      favoritosList = Array.isArray(ids) ? ids : [];
    } catch (err) {
      mostrarAlerta("Erro ao carregar favoritos.", "#ff3b30");
    }
  }

  // admin visibility handled by shared/admin-link.js; do not inspect token string here

  /* ================= PRODUTOS ================= */
  fetch("http://localhost:3000/produtos")
    .then((res) => res.json())
    .then((produtos) => {
      produtosContainer.innerHTML = "";

      // manter lista completa e gerar página com 12 produtos aleatórios
      const allProducts = Array.isArray(produtos) ? produtos : [];
      // função de embaralhar (Fisher-Yates)
      function shuffle(array) {
        const a = array.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      }

      const pageProducts = shuffle(allProducts).slice(0, 12);

      pageProducts.forEach((produto) => {
        const div = document.createElement("div");
        div.classList.add("produto");
        div.style.position = "relative";

        const isFav = favoritosList.includes(produto.id);

        div.innerHTML = `
          <button class="favoritoBTN" style="top:5px;right:8px;background:white;border:none;cursor:pointer;padding:5px;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.2);z-index:10;">
            <span class="material-symbols-outlined" style="font-size:24px;color:${
              isFav ? "#fa6db3" : "#999"
            };">
              ${isFav ? "favorite" : "favorite_border"}
            </span>
          </button>
          <h3>${produto.titulo}</h3>
          <img src="http://localhost:3000${produto.imagem_url || ""}" alt="${
          produto.titulo
        }">
          <p>${produto.descricao}</p>
          <p><strong>Preço:</strong> ${produto.preco}€</p>
          <p><strong>Categoria:</strong> ${produto.categoria}</p>
          <p><strong>Data:</strong> ${new Date(
            produto.data_publicacao
          ).toLocaleDateString()}</p>
        `;

        /* ========== handlers: favorito e abrir modal ========== */
        const favoritoBTN = div.querySelector(".favoritoBTN");
        const span = favoritoBTN ? favoritoBTN.querySelector("span") : null;

        if (favoritoBTN) {
          favoritoBTN.addEventListener("click", (e) => {
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
              method,
              headers: { Authorization: "Bearer " + token },
            };
            if (method === "POST") {
              options.headers["Content-Type"] = "application/json";
              options.body = JSON.stringify({ id_produto: produto.id });
            }

            fetch(url, options)
              .then((res) => res.json())
              .then(() => {
                if (!isFavorited) {
                  favoritosList.push(produto.id);
                  if (span) {
                    span.textContent = "favorite";
                    span.style.color = "#fa6db3";
                  }
                  mostrarAlerta(
                    `${produto.titulo} adicionado aos favoritos!`,
                    "#00cc66"
                  );
                } else {
                  favoritosList = favoritosList.filter(
                    (id) => id !== produto.id
                  );
                  if (span) {
                    span.textContent = "favorite_border";
                    span.style.color = "#999";
                  }
                  mostrarAlerta(
                    `${produto.titulo} removido dos favoritos!`,
                    "#ff9500"
                  );
                }
              })
              .catch((err) => {
                console.error(err);
                mostrarAlerta("Erro ao atualizar favorito", "#ff3b30");
              });
          });
        }

        div.addEventListener("click", (e) => {
          if (e.target.closest(".favoritoBTN")) return; // previne abrir modal ao clicar no favorito

          modal.style.display = "flex";
          modalNome.textContent = produto.titulo || "";
          modalDescricao.textContent = produto.descricao || "";
          modalVendedor.textContent = `Vendedor: ${
            produto.usuario_nome || "Vendedor"
          }`;
          modalImagem.src = produto.imagem_url
            ? `http://localhost:3000${produto.imagem_url}`
            : "";
          modalImagem.alt = produto.titulo || "Imagem do produto";
          modalPreco.textContent = produto.preco
            ? `Preço: ${produto.preco}€`
            : "";

          const vendedorId = produto.vendedor;
          if (!vendedorId) {
            mostrarAlerta("Vendedor não encontrado", "#ff3b30");
            return;
          }

          modalBTN.onclick = () => {
            const produtoId = produto.id;
            mostrarAlerta(
              `Abrindo conversa com ${produto.usuario_nome || "Vendedor"}...`,
              "#00cc66"
            );
            const tituloParam = encodeURIComponent(produto.titulo || "");
            const precoParam = encodeURIComponent(produto.preco || "");
            const imgUrl = produto.imagem_url
              ? `http://localhost:3000${produto.imagem_url}`
              : "";
            const imgParam = encodeURIComponent(imgUrl);
            const url = `../conversas/chat.html?vendedor=${encodeURIComponent(
              vendedorId
            )}&produto=${encodeURIComponent(
              produtoId
            )}&nome=${encodeURIComponent(
              produto.usuario_nome || "Vendedor"
            )}&titulo=${tituloParam}&preco=${precoParam}&img=${imgParam}`;
            window.location.href = url;
          };
        });

        produtosContainer.appendChild(div);
      });

      /* ================= FILTRO ================= */
      if (filtro) {
        filtro.addEventListener("click", async () => {
          modal.style.display = "flex";

          // 🔥 ESCONDE COMPLETAMENTE A IMAGEM NO MODAL DE FILTRO
          modalImagem.style.display = "none";
          modalImagem.src = "";
          modalImagem.alt = "";

          modalNome.textContent = "Filtrar Produtos";

          modalDescricao.innerHTML = `
        <form class="filtro-form">
          <label for="categoriaFiltro">Categoria</label>
          <select id="categoriaFiltro"></select>

          <div class="filtro-row">
            <div>
              <label for="precoMinimo">Preço mínimo</label>
              <input type="number" id="precoMinimo" min="0" step="0.01">
            </div>
            <div>
              <label for="precoMaximo">Preço máximo</label>
              <input type="number" id="precoMaximo" min="0" step="0.01">
            </div>
          </div>
        </form>
      `;

          modalVendedor.textContent = "";
          modalPreco.textContent = "";
          modalBTN.textContent = "Aplicar filtros";

          await carregarCategorias("categoriaFiltro");

          modalBTN.onclick = () => {
            const categoria = document.getElementById("categoriaFiltro").value;
            const precoMinimo = parseFloat(
              document.getElementById("precoMinimo").value
            );
            const precoMaximo = parseFloat(
              document.getElementById("precoMaximo").value
            );

            const produtos = document.querySelectorAll(".produto");

            produtos.forEach((produto) => {
              const precoText =
                produto.querySelector("p strong")?.parentElement.textContent;
              const preco = precoText
                ? parseFloat(
                    precoText.replace(/[^\d,.]/g, "").replace(",", ".")
                  )
                : NaN;

              const categoriaText =
                produto.querySelector("p:nth-of-type(3)")?.textContent;

              let mostrar = true;

              if (categoria && !categoriaText?.includes(categoria)) {
                mostrar = false;
              }

              if (!isNaN(precoMinimo) && preco < precoMinimo) {
                mostrar = false;
              }

              if (!isNaN(precoMaximo) && preco > precoMaximo) {
                mostrar = false;
              }

              produto.style.display = mostrar ? "flex" : "none";
            });

            modal.style.display = "none";
          };
        });
      }
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
