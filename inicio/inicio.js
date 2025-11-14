function mostrarAlerta(mensagem, cor = '#ff3b30', icone = '') {
    const alerta = document.getElementById('alerta');
    alerta.innerHTML = `
        <span style="font-size:1.3em;margin-right:8px;">${icone}</span>
        ${mensagem}
        <button class="fechar" onclick="this.parentElement.style.display='none'">&times;</button>
    `;
    alerta.style.background = cor;
    alerta.classList.add('mostrar');
    alerta.style.display = 'block';

    setTimeout(() => {
        alerta.classList.remove('mostrar');
        alerta.style.display = 'none';
    }, 3000);
}


function pesquisar() {
  let input = document.getElementById("pesquisar").value.toLowerCase();
  let produtos = document.getElementsByClassName("produto");
  for (let i = 0; i < produtos.length; i++) {
    let titulo = produtos[i].getElementsByTagName("h2")[0];
    if (titulo && titulo.innerHTML.toLowerCase().includes(input)) {
      produtos[i].style.display = "flex";
    } else {
      produtos[i].style.display = "none";
    }
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


  //carregar produtos
  fetch("http://localhost:3000/produtos")
    .then((res) => res.json())
    .then((produtos) => {
      produtosContainer.innerHTML = "";

      produtos.forEach((produto) => {
        const div = document.createElement("div");
        div.classList.add("produto");

        div.innerHTML = `
          <h3>${produto.titulo}</h3>
          <img src="http://localhost:3000${produto.imagem_url}" alt="${
          produto.titulo
        }">
          <p>${produto.descricao}</p>
          <p><strong>Preço:</strong> ${produto.preco}€</p>
          <p><strong>Categoria:</strong> ${produto.categoria}</p>
          <p><strong>Data:</strong> ${new Date(
            produto.data_publicacao
          ).toLocaleDateString()}</p>
        `;

        // abre o modal quando clias em algum produto
        div.addEventListener("click", () => {
          modal.style.display = "flex";
          modalNome.textContent = produto.titulo;
          if (modalImagem) {
            modalImagem.src = produto.imagem_url
              ? `http://localhost:3000${produto.imagem_url}`
              : "";
            modalImagem.alt = produto.titulo || "Imagem do produto";
          }
          if (modalPreco)
            modalPreco.textContent = produto.preco
              ? `Preço: ${produto.preco}€`
              : "";
          modalDescricao.textContent = produto.descricao;
          modalVendedor.textContent = `Vendedor: ${produto.usuario_nome || ""}`;
          modalBTN.onclick = () => {
            mostrarAlerta(`Mensagem enviada para ${produto.usuario_nome}!`);
            window.location.href = '../conversas/chat.html';
          };
        });

        produtosContainer.appendChild(div);
      });
    })
    .catch((err) => {
      mostrarAlerta("Erro ao carregar produtos.", "#ff3b30");
    });

  // fechar o modal 
  fechar.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Fechar o modal se clicar fora da caixa
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

};
