//FUNÇÃO PARA MOSTRAR ALERTAS
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

document.getElementById("BTN_verificar").addEventListener("submit", async function (e) { 
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const nome = document.getElementById("nome").value.trim();

    if(!email || !nome) {
        mostrarAlerta("Por favor, preencha todos os campos.", '#ff3b30');
        return;
    }

    try {  
        const response = await fetch("http://localhost:3000/usuarios", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, nome })
    });  
    
    const result = await response.json();

    if (response.ok) {
        mostrarAlerta("Verificação bem-sucedida! Por favor, insira a nova palavra passe.", '#4BB543');
        document.getElementById("campoSenha").style.display = "block";
        document.getElementById("BTN_verificar").style.display = "none";
    } else {
        mostrarAlerta(result.err || result.erro || "Utilizador não encontrado.");
    }
    } catch (error) {
        mostrarAlerta("Erro de conexão com o servidor: " + error.message);
    }
});


document.getElementById("Alterar").addEventListener("submit", async function (e) { 
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const nome = document.getElementById("nome").value.trim();
    const novaSenha = document.getElementById("novaSenha").value.trim();

    if(!email || !nome || !novaSenha) {
        mostrarAlerta("Por favor, preencha todos os campos.", '#ff3b30');
        return;
    }

    try {  
        const response = await fetch("http://localhost:3000/recuperar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, nome, novaSenha })
    });

    const result = await response.json();

    if (response.ok) {
        mostrarAlerta("Palavra passe alterada com sucesso!", '#4BB543');
        document.getElementById("formRecuperar").reset();
        document.getElementById("campoSenha").style.display = "block";
        document.getElementById("btnVerificar").style.display = "none";
        
        setTimeout(() => {
            window.location.href = "../Login/login.html";
        }, 2000);
    } else {
        mostrarAlerta(result.err || result.erro || "Erro ao alterar a palavra passe.");
    } 
    } catch (error) {   
        mostrarAlerta("Erro de conexão com o servidor: " + error.message);  
    }
});