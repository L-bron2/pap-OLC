const token = localStorage.getItem('token');

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

// Verificar se existe token
if (!token) {
    mostrarAlerta("Sem sessão iniciada, faça login.", "#ff3b30");
    setTimeout(() => {
        window.location.href = "../Login/login.html";
    }, 2000);
}

// Carregar dados do utilizador logado
async function loadProfile() {
    try {
        const headers = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch("http://localhost:3000/usuarios/id", { headers });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.erro || 'Erro ao carregar os dados.');
        }

        const usuarios = await response.json(); 
        const div = document.getElementById("usuarios");
        div.innerHTML = "";

        // Aceitar tanto array quanto objeto único
        const lista = Array.isArray(usuarios) ? usuarios : [usuarios];

        // Apenas usamos o primeiro (usuário logado)
        const usuario = lista[0];
        if (!usuario) {
            mostrarAlerta('Utilizador não encontrado', '#ff3b30');
            return;
        }

        const foto = usuario.foto_url || "../imagens/default.png";
        const nome = usuario.nome || '';
        const email = usuario.email || '';
        const dataRaw = usuario.data_publicacao;
        let dataFmt = "-";
        try { if (dataRaw) dataFmt = new Date(dataRaw).toLocaleDateString(); } catch {}

        // preencher card de perfil (avatar + infos)
        const profileCard = document.getElementById('profileCard');
        if (profileCard) {
            profileCard.innerHTML = `
                <div class="avatar"><img id="avatarImg" src="${foto}" alt="avatar"></div>
                <div class="username">${nome}</div>
                <div class="user-email">${email}</div>
                <div class="user-since">Desde: ${dataFmt}</div>
                <div class="edit-actions">
                  <button id="btnEditar" class="btn btn-edit">Editar</button>
                  <button id="btnSair" class="btn btn-logout">Sair</button>
                </div>
            `;
        }

        // preencher secção de detalhes (se necessário)
        div.innerHTML = `
            <div class="section-title">Informações</div>
            <p class="bio">Nome: ${nome}</p>
            <p class="bio">Email: ${email}</p>
        `;

        // configurar botão sair
        const btnSair = document.getElementById('btnSair');
        if (btnSair) {
            btnSair.addEventListener('click', () => {
                localStorage.removeItem('token');
                window.location.href = '../Login/login.html';
            });
        }

    } catch (error) {
        console.error('Perfil error:', error);
        mostrarAlerta(error.message || "Erro ao carregar dados.", "#ff3b30");
    }
}

window.onload = function(){
    // carregar perfil
    loadProfile();

    // configurar upload de foto
    const imagemInput = document.getElementById('imagem');
    const btnUpload = document.getElementById('btnUploadFoto');

    if (btnUpload) {
        btnUpload.addEventListener('click', async () => {
            if (!token) {
                mostrarAlerta('Precisa fazer login para atualizar a foto.', '#ff3b30');
                return;
            }
            const file = imagemInput.files[0];
            if (!file) {
                mostrarAlerta('Selecione uma imagem válida.', '#ff3b30');
                return;
            }
            if (!file.type.startsWith('image/')) {
                mostrarAlerta('O arquivo selecionado não é uma imagem.', '#ff3b30');
                return;
            }

            const formData = new FormData();
            formData.append('imagem', file);

            try {
                const response = await fetch('http://localhost:3000/usuarios/foto', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                let result = {};
                try { result = await response.json(); } catch (e) { }

                if (response.ok) {
                    mostrarAlerta(result.msg || 'Foto atualizada com sucesso!', '#4BB543');
                    // atualizar avatar mostrado sem recarregar a página
                    const avatarImg = document.getElementById('avatarImg');
                    if (avatarImg && result.foto_url) avatarImg.src = result.foto_url;
                } else {
                    mostrarAlerta(result.erro || 'Erro ao atualizar foto.', '#ff3b30');
                }
            } catch (err) {
                mostrarAlerta('Erro de conexão: ' + err.message, '#ff3b30');
            }
        });
    }
};

