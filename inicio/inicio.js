// Função para mostrar alertas
function mostrarAlerta(mensagem, cor = '#ff3b30', icone = '') {
    const alerta = document.getElementById('alerta');
    if (!alerta) return; 
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
    mostrarAlerta("Erro ao carregar produtos: " + error.message);
  }
};

