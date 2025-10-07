// Função para mostrar alertas
    function mostrarAlerta(mensagem, cor = '#ff3b30') {
    const alerta = document.getElementById('alerta');
    alerta.textContent = mensagem;
    alerta.style.background = cor;
    alerta.style.display = 'block';
    setTimeout(() => {
        alerta.style.display = 'none';
    }, 3000); // timer de 3s para desaparecer 
}


document.getElementById("formProduto").addEventListener("submit", async function (e) {
    e.preventDefault();
    const titulo = document.getElementById("titulo").value;     
    const descricao = document.getElementById("descricao").value;
    const preco = parseFloat(document.getElementById("preco").value);
    const categoria = document.getElementById("categoria").value;
    const imagem_url = document.getElementById("imagem_url").value;

    //verifiações (campos, preço, etc..)
    const campos =  this.querySelectorAll("input, textarea");
    let tudoPrenchido = true;
                
    campos.forEach(campo => {
    if (campo.value.trim() === "") {
        tudoPrenchido = false;
        campo.style.borderColor = "red";
    } else {
        campo.style.borderColor = "";
    }});

    if (!tudoPrenchido) {
        mostrarAlerta("Por favor, preencha todos os campos.");
        return;
    } 

    if (isNaN(preco) || preco <= 0) {
        mostrarAlerta("Digite um preço válido.");
        return;
    }

    if (!/^https?:\/\/.+\..+/.test(imagem_url)) {
        mostrarAlerta("Digite uma URL de imagem válida.");
        return;
    }

    try {  
        const response = await fetch("http://localhost:3000/produtos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            }, 
            body: JSON.stringify({ titulo, descricao, preco, categoria, imagem_url }),
        });

        //verificar resposta do servidor        
        let result = {};
        try {
            result = await response.json();
        } catch (jsonError) {
            mostrarAlerta("Erro do servidor.");
            return;
        }

        if (response.ok) {
            mostrarAlerta(result.msg || "Produto criado com sucesso!", '#4BB543');
            window.location.href = "../inicio/inicio.html";
        }
        else {
            mostrarAlerta(result.err || result.erro || "Erro ao criar produto.");
        }

        this.reset(); // Limpar o formulário
        campos.forEach(campo => campo.style.borderColor = ""); // Remove a borda vermelha
    }catch (error) {
        mostrarAlerta("Erro de conexão com o servidor: " + error.message);
    }

});