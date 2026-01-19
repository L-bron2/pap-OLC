
// Carrega as categorias ao abrir a página
async function carregarCategorias() {
  try {
    const res = await fetch("http://localhost:3000/categorias");
    if (!res.ok) throw new Error("Erro ao obter categorias");
    const categorias = await res.json();
    const select = document.getElementById("categoriaSelect");
    if (!select) return;
    select.innerHTML = '<option value="">Selecione uma categoria</option>';
    categorias.forEach((cat) => {
      const option = document.createElement("option");
      option.textContent = cat.categoria;
      select.appendChild(option);
    });
  } catch (err) {
    console.error(err);
    mostrarAlerta("Erro ao carregar categorias.", "#ff3b30");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (!token) {
    mostrarAlerta("Para vender um produto, é necessário fazer login.", "#ff3b30");
    setTimeout(() => {
      window.location.href = "../login/login.html";
    }, 1400);
    return;
  }

  // valida token junto ao servidor antes de permitir acesso
  fetch("http://localhost:3000/usuarios/id", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Token inválido");
      return res.json();
    })
    .then(() => {
      carregarCategorias();

      document.getElementById("formProduto").addEventListener("submit", async function (e) {
        e.preventDefault();

        const titulo = document.getElementById("titulo").value.trim();
        const descricao = document.getElementById("descricao").value.trim();
        const preco = parseFloat(document.getElementById("preco").value);
        const categoria = document.getElementById("categoriaSelect").value;
        const imagemInput = document.getElementById("imagem");
        const imagem = imagemInput.files[0];

        // valida os campos incluindo o select
        const campos = Array.from(this.querySelectorAll("input:not([type=file]), textarea, select"));
        let tudoPreenchido = true;

        campos.forEach((campo) => {
          if (campo.tagName === "SELECT") {
            if (campo.value === "") {
              tudoPreenchido = false;
              campo.style.borderColor = "red";
            } else {
              campo.style.borderColor = "";
            }
          } else if (campo.value.trim() === "") {
            tudoPreenchido = false;
            campo.style.borderColor = "red";
          } else {
            campo.style.borderColor = "";
          }
        });

        if (!tudoPreenchido) {
          mostrarAlerta("Por favor, preencha todos os campos.", "#ff3b30");
          return;
        }

        if (isNaN(preco) || preco <= 0) {
          mostrarAlerta("Digite um preço válido.", "#ff3b30");
          return;
        }

        // verifica a imagem
        if (!imagem) {
          mostrarAlerta("Selecione uma imagem válida.", "#ff3b30");
          imagemInput.style.borderColor = "red";
          return;
        } else if (!imagem.type.startsWith("image/")) {
          mostrarAlerta("O arquivo selecionado não é uma imagem.", "#ff3b30");
          imagemInput.style.borderColor = "red";
          return;
        } else {
          imagemInput.style.borderColor = "";
        }

        const formData = new FormData();
        formData.append("titulo", titulo);
        formData.append("descricao", descricao);
        formData.append("preco", preco);
        formData.append("categoria", categoria);
        formData.append("imagem", imagem);

        try {
          const response = await fetch("http://localhost:3000/produtos", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          let result = {};
          try {
            result = await response.json();
          } catch (jsonError) {
            mostrarAlerta("Erro ao processar resposta do servidor.", "#ff3b30");
            return;
          }

          if (response.ok) {
            mostrarAlerta(result.msg || "Produto criado com sucesso!", "#4BB543",);
            this.reset();
            campos.forEach((campo) => (campo.style.borderColor = ""));
            imagemInput.style.borderColor = "";
            setTimeout(() => {
              window.location.href = "../inicio/inicio.html";
            }, 3000);

          } else {
            mostrarAlerta(result.erro || result.err || result.message || "Erro inesperado ao criar produto.", "#ff3b30");
          }
        } catch (error) {
          mostrarAlerta("Erro de conexão com o servidor: " + error.message, "#ff3b30");
        }
      });
    })
    .catch(() => {
      mostrarAlerta("Sessão inválida. Faça login novamente.", "#ff3b30");
      setTimeout(() => {
        localStorage.removeItem("token");
        window.location.href = "../login/login.html";
      }, 1200);
    });
});
