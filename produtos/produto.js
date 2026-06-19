const API_URL = "http://localhost:3000";

function marcarErro(campo, temErro) {
  if (!campo) return;

  campo.classList.toggle("erro", temErro);
  const wrapper = campo.closest(".campo");
  if (wrapper) wrapper.classList.toggle("erro", temErro);
}

function configurarImagemPreview() {
  const imagemInput = document.getElementById("imagem");
  const uploadBox = document.querySelector(".upload-box");
  const imagemTexto = document.getElementById("imagemTexto");
  const imagemPreview = document.getElementById("imagemPreview");

  if (!imagemInput || !uploadBox || !imagemTexto || !imagemPreview) return;

  imagemInput.addEventListener("change", () => {
    const imagem = imagemInput.files[0];
    marcarErro(uploadBox, false);

    if (!imagem) {
      uploadBox.classList.remove("tem-imagem");
      imagemTexto.textContent = "Escolher imagem";
      imagemPreview.removeAttribute("src");
      return;
    }

    imagemTexto.textContent = imagem.name;

    if (imagem.type.startsWith("image/")) {
      imagemPreview.src = URL.createObjectURL(imagem);
      uploadBox.classList.add("tem-imagem");
    } else {
      uploadBox.classList.remove("tem-imagem");
      imagemPreview.removeAttribute("src");
    }
  });
}

function configurarLimpezaDeErros(form) {
  form.querySelectorAll("input, textarea, select").forEach((campo) => {
    campo.addEventListener("input", () => marcarErro(campo, false));
    campo.addEventListener("change", () => marcarErro(campo, false));
  });
}

async function carregarCategorias() {
  try {
    const res = await fetch(`${API_URL}/categorias`);
    if (!res.ok) throw new Error("Erro ao obter categorias");

    const categorias = await res.json();
    const select = document.getElementById("categoriaSelect");
    if (!select) return;

    select.innerHTML = '<option value="">Selecione uma categoria</option>';

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

function validarFormulario(form) {
  const titulo = document.getElementById("titulo");
  const descricao = document.getElementById("descricao");
  const preco = document.getElementById("preco");
  const categoria = document.getElementById("categoriaSelect");
  const imagemInput = document.getElementById("imagem");
  const uploadBox = document.querySelector(".upload-box");

  const camposObrigatorios = [titulo, descricao, preco, categoria];
  let valido = true;

  camposObrigatorios.forEach((campo) => {
    const vazio = !campo.value.trim();
    marcarErro(campo, vazio);
    if (vazio) valido = false;
  });

  if (!valido) {
    mostrarAlerta("Por favor, preencha todos os campos.", "#ff3b30");
    return null;
  }

  const precoNumero = parseFloat(preco.value);
  if (Number.isNaN(precoNumero) || precoNumero <= 0) {
    marcarErro(preco, true);
    mostrarAlerta("Digite um pre\u00e7o v\u00e1lido.", "#ff3b30");
    return null;
  }

  const imagem = imagemInput.files[0];
  if (!imagem) {
    marcarErro(uploadBox, true);
    mostrarAlerta("Selecione uma imagem v\u00e1lida.", "#ff3b30");
    return null;
  }

  if (!imagem.type.startsWith("image/")) {
    marcarErro(uploadBox, true);
    mostrarAlerta("O arquivo selecionado n\u00e3o \u00e9 uma imagem.", "#ff3b30");
    return null;
  }

  marcarErro(uploadBox, false);

  const formData = new FormData();
  formData.append("titulo", titulo.value.trim());
  formData.append("descricao", descricao.value.trim());
  formData.append("preco", precoNumero);
  formData.append("categoria", categoria.value);
  formData.append("imagem", imagem);

  return formData;
}

function limparFormulario(form) {
  const uploadBox = document.querySelector(".upload-box");
  const imagemTexto = document.getElementById("imagemTexto");
  const imagemPreview = document.getElementById("imagemPreview");

  form.reset();
  form.querySelectorAll(".erro").forEach((campo) => campo.classList.remove("erro"));

  if (uploadBox) uploadBox.classList.remove("tem-imagem", "erro");
  if (imagemTexto) imagemTexto.textContent = "Escolher imagem";
  if (imagemPreview) imagemPreview.removeAttribute("src");
}

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const form = document.getElementById("formProduto");
  const botaoSubmit = form?.querySelector('button[type="submit"]');

  configurarImagemPreview();

  if (!form || !botaoSubmit) return;
  configurarLimpezaDeErros(form);

  if (!token) {
    mostrarAlerta("Para vender um produto, \u00e9 necess\u00e1rio fazer login.", "#ff3b30");
    setTimeout(() => {
      window.location.href = "../login/login.html";
    }, 1400);
    return;
  }

  fetch(`${API_URL}/usuarios/id`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Token inv\u00e1lido");
      return res.json();
    })
    .then(() => {
      carregarCategorias();

      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = validarFormulario(form);
        if (!formData) return;

        const textoOriginal = botaoSubmit.innerHTML;
        botaoSubmit.disabled = true;
        botaoSubmit.innerHTML = '<span class="material-symbols-outlined">hourglass_top</span><span>A publicar...</span>';

        try {
          const response = await fetch(`${API_URL}/produtos`, {
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
            mostrarAlerta(result.msg || "Produto criado com sucesso!", "#4BB543");
            limparFormulario(form);

            setTimeout(() => {
              window.location.href = "../inicio/inicio.html";
            }, 1800);
          } else {
            mostrarAlerta(result.erro || result.err || result.message || "Erro inesperado ao criar produto.", "#ff3b30");
          }
        } catch (error) {
          mostrarAlerta("Erro de conex\u00e3o com o servidor: " + error.message, "#ff3b30");
        } finally {
          botaoSubmit.disabled = false;
          botaoSubmit.innerHTML = textoOriginal;
        }
      });
    })
    .catch(() => {
      mostrarAlerta("Sess\u00e3o inv\u00e1lida. Fa\u00e7a login novamente.", "#ff3b30");
      setTimeout(() => {
        localStorage.removeItem("token");
        window.location.href = "../login/login.html";
      }, 1200);
    });
});
