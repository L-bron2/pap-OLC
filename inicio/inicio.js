function normalizarTexto(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function aguardarPesquisa(func, tempoEspera) {
  //
  let timeout;
  return function executada(...args) {
    const depois = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(depois, tempoEspera);
  };
}

window.onload = async function () {
  const containerProdutos = document.getElementById("produtos-container");
  const modalProduto = document.getElementById("caixaFlutuante");
  const botaoFechar = document.getElementById("fechar");
  const carregando = document.getElementById("loading");

  const tituloModal = document.getElementById("nome");
  const descricaoModal = document.getElementById("descricao");
  const vendedorModal = document.getElementById("vendedor");
  const botaoModal = document.getElementById("BTN");
  const imagemModal = document.getElementById("modalImagem");
  const precoModal = document.getElementById("Preco");
  const botaoFiltro = document.getElementById("filtro");
  const campoPesquisa = document.getElementById("pesquisar");

  const modalFiltro = document.getElementById("modalFiltro");
  const fecharFiltro = document.getElementById("fecharFiltro");
  const limparFiltrosBtn = document.getElementById("limparFiltros");
  const aplicarFiltrosBtn = document.getElementById("aplicarFiltros");

  const home = document.getElementById("home");
  const chat = document.getElementById("chat");
  const perfil = document.getElementById("perfil");
  const favorito = document.getElementById("Favorito");


  let todosProdutos = [];
  let produtosFiltrados = [];
  let paginaAtual = 1;
  const produtosPorPagina = 12;
  const token = localStorage.getItem("token");
  let listaFavoritos = [];

  // Mostrar carregamento
  function mostrarCarregamento() {
    carregando.style.display = "flex";
    containerProdutos.innerHTML = "";
  }

  // Esconder carregamento
  function esconderCarregamento() {
    carregando.style.display = "none";
  }

  // Limpar modal
  function limparModal() {
    tituloModal.textContent = "";
    descricaoModal.innerHTML = "";
    vendedorModal.textContent = "";
    precoModal.textContent = "";
    imagemModal.src = "";
    imagemModal.style.display = "none";
    imagemModal.alt = "";
    botaoModal.textContent = "";
    botaoModal.onclick = null;
  }

  function obterListaAtual() {
    return produtosFiltrados.length ? produtosFiltrados : todosProdutos;
  }

  async function carregarFavoritos() {
    if (!token)  return;
    try {
      const resposta = await fetch("http://localhost:3000/favoritos", {
        headers: { Authorization: "Bearer " + token },
      });
      const ids = await resposta.json();
      listaFavoritos = Array.isArray(ids) ? ids : [];
    } catch (erro) {
      console.error("Erro ao carregar favoritos:", erro);
    }
  }

  async function alternarFavorito(produtoId) {
    if (!token) {
      mostrarAlerta("Faca login para favoritar produtos", "#ff9500");
      return;
    }

    const idNormalizado = Number(produtoId);
    if (!idNormalizado) {
      mostrarAlerta("Produto invalido", "#ff3b30");
      return;
    }

    try {
      const estaFavoritado = listaFavoritos.map(Number).includes(idNormalizado);
      const url = estaFavoritado
        ? `http://localhost:3000/favoritos/${idNormalizado}`
        : "http://localhost:3000/favoritos";

      const resposta = await fetch(url, {
        method: estaFavoritado ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: estaFavoritado
          ? undefined
          : JSON.stringify({ produto_id: idNormalizado }),
      });

      if (!resposta.ok) throw new Error("Falha na API");

      if (estaFavoritado) {
        listaFavoritos = listaFavoritos.filter(
          (id) => Number(id) !== idNormalizado,
        );
      } else {
        listaFavoritos.push(idNormalizado);
      }

      carregarProdutosPagina(paginaAtual);
      mostrarAlerta(
        estaFavoritado ? "Removido dos favoritos" : "Adicionado aos favoritos!",
        estaFavoritado ? "#ff9500" : "#34c759",
      );
    } catch (erro) {
      console.error(erro);
      mostrarAlerta("Erro ao atualizar favoritos", "#ff3b30");
    }
  }

  function carregarProdutosPagina(pagina) {
    containerProdutos.innerHTML = "";
    const lista = obterListaAtual();
    const inicio = (pagina - 1) * produtosPorPagina;
    const fim = inicio + produtosPorPagina;
    const produtosPagina = lista.slice(inicio, fim);

    if (produtosPagina.length === 0) {
      containerProdutos.innerHTML = `
        <div style="width: 100%; text-align: center; padding: 60px 20px; color: var(--texto-suave);">
          <span class="material-symbols-outlined" style="font-size: 64px; display: block; margin-bottom: 16px; opacity: 0.5;">search_off</span>
          <h3>Nenhum produto encontrado</h3>
          <p>Tente ajustar os filtros ou a pesquisa</p>
        </div>
      `;
      return;
    }

    const elementosProdutos = produtosPagina.map((produto) => {
      const div = document.createElement("div");
      div.classList.add("produto");
      const idProduto = Number(produto.id || produto._id);
      const estaFavoritado = listaFavoritos.map(Number).includes(idProduto);

      div.innerHTML = `
        <button class="favoritoBTN ${estaFavoritado ? "favorito-ativo" : ""}" data-id-produto="${idProduto}">
          <span class="material-symbols-outlined">${estaFavoritado ? "favorite" : "favorite_border"}</span>
        </button>
        ${
          produto.imagem_url
            ? `<img src="http://localhost:3000${produto.imagem_url}" alt="${produto.titulo || "Produto"}" loading="lazy">`
            : `<div style="width: 100%; height: 160px; background: var(--glass); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--texto-suave);">
              <span class="material-symbols-outlined">image_not_supported</span>
            </div>`
        }
        <h3>${produto.titulo || "Produto sem título"}</h3>
        <p><strong>Descrição:</strong> ${produto.descricao?.substring(0, 80) || "Sem descrição"} ${produto.descricao && produto.descricao.length > 80 ? "..." : ""}</p>
        <p><strong>Preço:</strong> ${produto.preco ? produto.preco.toLocaleString("pt-PT") + "€" : "Preço sob consulta"}</p>
        <p><strong>Categoria:</strong> ${produto.categoria || "Não especificada"}</p>
        <p><strong>Vendedor:</strong> ${produto.usuario_nome || "Anônimo"}</p>
      `;

      const botaoFavorito = div.querySelector(".favoritoBTN");
      const img = div.querySelector("img");

      botaoFavorito.addEventListener("click", async (e) => {
        e.stopPropagation();
        const idProduto = botaoFavorito.dataset.idProduto;
        await alternarFavorito(idProduto);
      });

      if (img) {
        img.onerror = () => {
          img.style.display = "none";
          const alternativa = img.nextElementSibling;
          if (alternativa) alternativa.style.display = "flex";
        };
      }

      div.addEventListener("click", (e) => {
        if (e.target.closest(".favoritoBTN")) return;
        abrirModalProduto(produto);
      });

      return div;
    });

    elementosProdutos.forEach((el) => containerProdutos.appendChild(el));
  }

  function carregarPaginacao() {
    const lista = obterListaAtual();
    const totalPaginas = Math.ceil(lista.length / produtosPorPagina);
    const divPaginas = document.getElementById("Pages");
    divPaginas.innerHTML = "";

    if (totalPaginas === 0) return;

    if (paginaAtual > 1) {
      const btnAnterior = document.createElement("button");
      btnAnterior.className = "page-btn";
      btnAnterior.innerHTML =
        '<span class="material-symbols-outlined">chevron_left</span>';
      btnAnterior.onclick = () => {
        paginaAtual--;
        carregarProdutosPagina(paginaAtual);
        carregarPaginacao();
      };
      divPaginas.appendChild(btnAnterior);
    }

    const paginasVisiveis = 5;
    let paginaInicio = Math.max(
      1,
      paginaAtual - Math.floor(paginasVisiveis / 2),
    );
    let paginaFim = Math.min(totalPaginas, paginaInicio + paginasVisiveis - 1);

    if (paginaFim - paginaInicio < paginasVisiveis - 1) {
      paginaInicio = Math.max(1, paginaFim - paginasVisiveis + 1);
    }

    for (let i = paginaInicio; i <= paginaFim; i++) {
      const btn = document.createElement("button");
      btn.className = `page-btn ${i === paginaAtual ? "active" : ""}`;
      btn.textContent = i;
      btn.onclick = () => {
        paginaAtual = i;
        carregarProdutosPagina(paginaAtual);
        carregarPaginacao();
      };
      divPaginas.appendChild(btn);
    }

    if (paginaAtual < totalPaginas) {
      const btnProxima = document.createElement("button");
      btnProxima.className = "page-btn";
      btnProxima.innerHTML =
        '<span class="material-symbols-outlined">chevron_right</span>';
      btnProxima.onclick = () => {
        paginaAtual++;
        carregarProdutosPagina(paginaAtual);
        carregarPaginacao();
      };
      divPaginas.appendChild(btnProxima);
    }
  }

  function abrirModalProduto(produto) {
    limparModal();
    modalProduto.style.display = "flex";

    imagemModal.style.display = "block";
    tituloModal.textContent = produto.titulo || "Produto sem título";
    precoModal.textContent = produto.preco
      ? `Preço: ${produto.preco.toLocaleString("pt-PT")}€`
      : "Preço sob consulta";
    descricaoModal.textContent = `Descrição: ${produto.descricao || "Sem descrição"}`;
    vendedorModal.textContent = `Vendedor: ${produto.usuario_nome || "Anônimo"}`;

    if (produto.imagem_url) {
      imagemModal.src = `http://localhost:3000${produto.imagem_url}`;
      imagemModal.alt = produto.titulo || "Produto";
    }

    botaoModal.textContent = "💬 Conversar com vendedor";
    botaoModal.onclick = () => {
      if (!token) {
        mostrarAlerta("Faça login para conversar", "#ff9500", "aviso");
        return;
      }
      window.location.href = `../conversas/chat.html?vendedor=${produto.usuario_id || produto.vendedor || ""}`;
      modalProduto.style.display = "none";
    };
  }

  // Carregar categorias para filtro
  async function carregarCategorias(selectId) {
    try {
      const resposta = await fetch("http://localhost:3000/categorias");
      if (!resposta.ok) throw new Error("Erro ao obter categorias");
      const categorias = await resposta.json();
      const select = document.getElementById(selectId);
      if (!select) return;

      select.innerHTML = "<option value=''>Todas categorias</option>";
      categorias.forEach((cat) => {
        const opcao = document.createElement("option");
        opcao.value = cat.categoria;
        opcao.textContent = cat.categoria;
        select.appendChild(opcao);
      });
    } catch (erro) {
      console.error(erro);
      mostrarAlerta("Erro ao carregar categorias", "#ff3b30");
    }
  }

  // Mostra o modal de filtros proprio,
  botaoFiltro.addEventListener("click", async (e) => {
    e.stopPropagation();
    modalFiltro.style.display = "flex";
    await carregarCategorias("categoriaFiltro");
  });

  fecharFiltro.addEventListener("click", () => {
    modalFiltro.style.display = "none";
  });

  modalFiltro.addEventListener("click", (e) => {
    if (e.target === modalFiltro) modalFiltro.style.display = "none";
  });

  limparFiltrosBtn.addEventListener("click", () => {
    document.getElementById("categoriaFiltro").value = "";
    document.getElementById("precoMinimo").value = "";
    document.getElementById("precoMaximo").value = "";
    produtosFiltrados = [];
    paginaAtual = 1;
    carregarProdutosPagina(paginaAtual);
    carregarPaginacao();
    modalFiltro.style.display = "none";
  });

  aplicarFiltrosBtn.addEventListener("click", () => {
    const categoria = document.getElementById("categoriaFiltro").value;
    const minimo = parseFloat(document.getElementById("precoMinimo").value) || 0;
    const maximo = parseFloat(document.getElementById("precoMaximo").value) || Infinity;

    produtosFiltrados = todosProdutos.filter((p) => {
      const preco = Number(p.preco) || 0;
      if (categoria && p.categoria !== categoria) return false;
      if (preco < minimo || preco > maximo) return false;
      return true;
    });

    paginaAtual = 1;
    carregarProdutosPagina(paginaAtual);
    carregarPaginacao();
    modalFiltro.style.display = "none";

    mostrarAlerta(
      produtosFiltrados.length > 0
        ? `${produtosFiltrados.length} produto(s) encontrado(s)`
        : "Nenhum resultado encontrado",
      produtosFiltrados.length > 0 ? "#34c759" : "#ff9500",
    );
  });

  // Pesquisa 
  const pesquisaAguardada = aguardarPesquisa(() => {
    const termo = normalizarTexto(campoPesquisa.value);

    if (termo === "") {
      produtosFiltrados = [];
    } else {
      produtosFiltrados = todosProdutos.filter(
        (produto) =>
          normalizarTexto(produto.titulo).includes(termo) ||
          normalizarTexto(produto.descricao).includes(termo),
      );
    }

    paginaAtual = 1;
    carregarProdutosPagina(paginaAtual);
    carregarPaginacao();
  }, 300);

  campoPesquisa.addEventListener("input", pesquisaAguardada);

  // Listeners modais
  botaoFechar.addEventListener("click", () => {
    modalProduto.style.display = "none";
  });

  window.addEventListener("click", (evento) => {
    if (evento.target === modalProduto) {
      modalProduto.style.display = "none";
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalProduto.style.display === "flex") {
      modalProduto.style.display = "none";
    }
  });

  // Inicialização
  mostrarCarregamento();
  await carregarFavoritos();

  fetch("http://localhost:3000/produtos")
    .then((resposta) => {
      if (!resposta.ok) throw new Error("Falha ao carregar produtos");
      return resposta.json();
    })
    .then((produtos) => {
      todosProdutos = Array.isArray(produtos) ? produtos : [];
      esconderCarregamento();
      carregarProdutosPagina(paginaAtual);
      carregarPaginacao();

      if (todosProdutos.length === 0) {
        containerProdutos.innerHTML = `
          <div style="width: 100%; text-align: center; padding: 60px 20px; color: var(--texto-suave);">
            <span class="material-symbols-outlined" style="font-size: 64px; display: block; margin-bottom: 16px; opacity: 0.5;">storefront</span>
            <h3>Nenhum produto disponível</h3>
            <p>Seja o primeiro a publicar! 🎉</p>
            <a href="../produtos/novo_produto.html" style="margin-top: 20px; display: inline-block; padding: 12px 24px; background: var(--botao); color: white; text-decoration: none; border-radius: 12px;">Criar produto</a>
          </div>
        `;
      }
    })
    .catch((erro) => {
      console.error(erro);
      esconderCarregamento();
      containerProdutos.innerHTML = `
        <div style="width: 100%; text-align: center; padding: 60px 20px; color: var(--texto-suave);">
          <span class="material-symbols-outlined" style="font-size: 64px; display: block; margin-bottom: 16px;">error</span>
          <h3>Erro ao carregar produtos</h3>
          <p>Tente novamente em instantes</p>
          <button onclick="location.reload()" style="margin-top: 20px; padding: 12px 24px; background: var(--botao); color: white; border: none; border-radius: 12px; cursor: pointer;">Tentar novamente</button>
        </div>
      `;
      mostrarAlerta("Erro ao carregar. Verifique conexão.", "#ff3b30");
    });
};
