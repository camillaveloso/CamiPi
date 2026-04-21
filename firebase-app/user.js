let app = null;
let auth = null;
let db = null;

const $ = (id) => document.getElementById(id);

const sessionInfo = $("sessionInfo");
const userDataOutput = $("userDataOutput");
const userAccessPill = $("userAccessPill");
const pageStatus = $("pageStatus");

function setPillState(
  element,
  allowed,
  allowedText = "Acesso permitido",
  deniedText = "Acesso negado"
) {
  element.className = allowed ? "pill ok" : "pill no";
  element.textContent = allowed ? allowedText : deniedText;
}

function showSession(user, role) {
  sessionInfo.innerHTML = `
    <div class="info-card">
      <span class="info-label">UID</span>
      <span class="info-value">${user.uid}</span>
    </div>
    <div class="info-card">
      <span class="info-label">Email</span>
      <span class="info-value">${user.email}</span>
    </div>
    <div class="info-card">
      <span class="info-label">Cargo</span>
      <span class="info-value">${role}</span>
    </div>
  `;
}

async function initPage() {
  const savedConfig = localStorage.getItem("firebaseConfig");

  if (!savedConfig) {
    alert("Configuração do Firebase não encontrada. Volte para a página inicial.");
    window.location.href = "index.html";
    return;
  }

  const parsedConfig = JSON.parse(savedConfig);

  const [
    { initializeApp, getApps, getApp },
    { getAuth, onAuthStateChanged, signOut },
    { getDatabase, ref, get, update }
  ] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js")
  ]);

  app = getApps().length ? getApp() : initializeApp(parsedConfig);
  auth = getAuth(app);
  db = getDatabase(app);

  window._pageFns = { signOut, ref, get, update };

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Você precisa estar logado.");
      window.location.href = "index.html";
      return;
    }

    try {
      const snap = await get(ref(db, `users/${user.uid}`));

      if (!snap.exists()) {
        alert("Perfil do usuário não encontrado.");
        window.location.href = "index.html";
        return;
      }

      const role = snap.val().role;

      if (role !== "user") {
        window.location.href = role === "admin" ? "admin.html" : "index.html";
        return;
      }

      showSession(user, role);
      pageStatus.textContent = "Usuário autenticado com sucesso.";
    } catch (error) {
      pageStatus.textContent = `Erro ao carregar sessão: ${error.message}`;
    }
  });
}

$("btnReadProfile").addEventListener("click", async () => {
  if (!auth?.currentUser) {
    alert("Faça login primeiro.");
    return;
  }

  try {
    const { ref, get } = window._pageFns;
    const snap = await get(ref(db, `users/${auth.currentUser.uid}`));

    userDataOutput.textContent = JSON.stringify(snap.val(), null, 2);
    setPillState(userAccessPill, true);
    pageStatus.textContent = "Perfil carregado com sucesso.";
  } catch (error) {
    userDataOutput.textContent = error.message;
    setPillState(userAccessPill, false);
    pageStatus.textContent = `Erro ao ler perfil: ${error.message}`;
  }
});

$("btnUpdateProfile").addEventListener("click", async () => {
  if (!auth?.currentUser) {
    alert("Faça login primeiro.");
    return;
  }

  try {
    const { ref, update } = window._pageFns;

    await update(ref(db, `users/${auth.currentUser.uid}`), {
      lastLoginAt: Date.now()
    });

    userDataOutput.textContent = JSON.stringify(
      { ok: true, message: "lastLoginAt atualizado" },
      null,
      2
    );

    setPillState(userAccessPill, true);
    pageStatus.textContent = "Último acesso atualizado com sucesso.";
  } catch (error) {
    userDataOutput.textContent = error.message;
    setPillState(userAccessPill, false);
    pageStatus.textContent = `Erro ao atualizar perfil: ${error.message}`;
  }
});

$("btnLogout").addEventListener("click", async () => {
  try {
    await window._pageFns.signOut(auth);
    window.location.href = "index.html";
  } catch (error) {
    pageStatus.textContent = `Erro no logout: ${error.message}`;
  }
});

$("btnBackToLogin").addEventListener("click", () => {
  window.location.href = "index.html";
});

window.addEventListener("DOMContentLoaded", initPage);
