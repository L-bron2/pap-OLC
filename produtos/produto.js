const token = localStorage.getItem('token');

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
    }, 30000);
}

document.getElementById("formProduto").addEventListener("submit", async function (e) {
    e.preventDefault();

    // pega os dados do FORMDATA
    const titulo = document.getElementById("titulo").value.trim();
    const descricao = document.getElementById("descricao").value.trim();
    const preco = parseFloat(document.getElementById("preco").value);
    const categoria = document.getElementById("categoria").value.trim();
    const imagemInput = document.getElementById("imagem");
    const imagem = imagemInput.files[0];

    // validar se o utilizador está logado
    if (!token) {
        mostrarAlerta("Precisa fazer logi para vender!.", "#ff3b30");
        return;
    }

    // valida os campos menos o da imagem 
    const campos = Array.from(this.querySelectorAll("input:not([type=file]), textarea"));
    let tudoPreenchido = true;

    campos.forEach(campo => {
        if (campo.value.trim() === "") {
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

    // valida a imagem 
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
        // envia a requisição para o servidor
        const response = await fetch("http://localhost:3000/produtos", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}` 
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
            mostrarAlerta(result.msg || "Produto criado com sucesso!", '#4BB543', '✅');
            this.reset();

            // limpa as bordas vermelhas
            campos.forEach(campo => campo.style.borderColor = "");
            imagemInput.style.borderColor = "";

            // redireciona para a página inicia 
            setTimeout(() => {
                window.location.href = "../inicio/inicio.html";
            }, 3000);
        } else {
            mostrarAlerta(result.erro || result.err || result.message || "Erro ao criar produto.", "#ff3b30");
        }

    } catch (error) {
        mostrarAlerta("Erro de conexão com o servidor: " + error.message, "#ff3b30");
    }
});
