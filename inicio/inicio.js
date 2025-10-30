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


window.onload = async function () {
  try {
    const response = await fetch("http://localhost:3000/produtos");
    const produtos = await response.json();
    const div = document.getElementById("Produtos");
    div.innerHTML = "";

    produtos.forEach((produto) => {
      const item = document.createElement("div");
      item.className = "produto";
      item.innerHTML = `
                <h2>${produto.titulo}</h2>
                <img src="${
                  produto.imagem_url
                }" alt="Imagem do produto" style="max-width:200px;max-height:200px;">
                <p>${produto.descricao}</p>
                <p>Preço: R$ ${produto.preco}</p>
                <p>Categoria: ${produto.categoria}</p>
                <p>Data: ${new Date(
                  produto.data_publicacao
                ).toLocaleDateString()}</p>
            `;
      div.appendChild(item);
    });
  } catch (error) {
    document.getElementById("Produtos").innerText =
      "Erro ao carregar produtos.";
  }
};

