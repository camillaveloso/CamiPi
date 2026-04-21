let app = null;
let auth = null;
let db = null;
let firebaseReady = false;
let authListenerAttached = false;

const $ = (id) => document.getElementById(id);

const configStatus = $("configStatus");
const authStatus = $("authStatus");
const sessionInfo = $("sessionInfo");
const userDataOutput = $("userDataOutput");
const adminDataOutput = $("adminDataOutput");
const userAccessPill = $("userAccessPill");
const adminAccessPill = $("adminAccessPill");

const exampleConfig = {
  apiKey: "AIzaSyB740auKQWpHqM7QjHgeoqwYDn1WqmpchI",
  authDomain: "camipi-modelagem.firebaseapp.com",
  databaseURL: "https://camipi-modelagem-default-rtdb.firebaseio.com",
  projectId: "camipi-modelagem",
  storageBucket: "camipi-modelagem.firebasestorage.app",
  messagingSenderId: "1010284546939",
  appId: "1:1010284546939:web:acedcdf668dfd1f8ac0bde"
};

$("btnLoadExample").addEventListener("click", () => {
  $("firebaseConfig").value = JSON.stringify(exampleConfig, null, 2);
});

async function ensureFirebaseInitialized() {
  if (firebaseReady) {
    return true;
  }

  alert("Inicialize o Firebase primeiro.");
  return false;
}

function setPillState(
  element,
  allowed,
  allowedText = "Acesso permitido",
  deniedText = "Acesso negado"
) {
  element.className = allowed ? "pill ok" : "pill no";
  element.textContent = allowed ? allowedText : deniedText;
}

function resetSessionInfo() {
  sessionInfo.innerHTML = `
    <div class="info-card">
      <span class="info-label">UID</span>
      <span class="info-value">—</span>
    </div>
    <div class="info-card">
      <span class="info-label">Email</span>
      <span class="info-value">—</span>
    </div>
    <div class="info-card">
      <span class="info-label">Cargo salvo no banco</span>
      <span class="info-value">—</span>
    </div>
  `;
}

function showLoggedUser(user, role) {
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
      <span class="info-label">Cargo salvo no banco</span>
      <span class="info-value">${role}</span>
    </div>
  `;
}

$("btnInit").addEventListener("click", async () => {
  try {
    if (firebaseReady) {
      configStatus.textContent = "Firebase já foi inicializado.";
      return;
    }

    const parsedConfig = JSON.parse($("firebaseConfig").value);

    const [
      { initializeApp, getApps, getApp },
      {
        getAuth,
        onAuthStateChanged,
        createUserWithEmailAndPassword,
        signInWithEmailAndPassword,
        signOut
      },
      { getDatabase, ref, set, get, update }
    ] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js")
    ]);

    app = getApps().length ? getApp() : initializeApp(parsedConfig);
    auth = getAuth(app);
    db = getDatabase(app);
    firebaseReady = true;

    window._firebaseFns = {
      createUserWithEmailAndPassword,
      signInWithEmailAndPassword,
      signOut,
      ref,
      set,
      get,
      update,
      onAuthStateChanged
    };

    configStatus.textContent =
      "Firebase inicializado com sucesso. Agora você já pode cadastrar ou entrar.";
    $("btnInit").disabled = true;
    $("btnInit").textContent = "Firebase inicializado";

    if (!authListenerAttached) {
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          authStatus.textContent = "Nenhum usuário autenticado.";
          resetSessionInfo();
          return;
        }

        authStatus.textContent = `Autenticado: ${user.email}`;

        let role = "(não encontrado)";

        try {
          const snap = await get(ref(db, `users/${user.uid}`));
          if (snap.exists()) {
            role = snap.val().role || "(sem cargo)";
          }
        } catch (error) {
          role = `(erro ao ler cargo: ${error.message})`;
        }

        showLoggedUser(user, role);
      });

      authListenerAttached = true;
    }
  } catch (error) {
    configStatus.textContent = `Erro ao inicializar: ${error.message}`;
  }
});

$("btnRegister").addEventListener("click", async () => {
  if (!(await ensureFirebaseInitialized())) return;

  const email = $("email").value.trim();
  const password = $("password").value;
  const role = $("roleSelect").value;

  try {
    const { createUserWithEmailAndPassword, ref, set } = window._firebaseFns;

    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await set(ref(db, `users/${cred.user.uid}`), {
      email,
      role,
      createdAt: Date.now(),
      lastLoginAt: Date.now()
    });

    authStatus.textContent = `Conta criada com sucesso para ${email}. Cargo salvo: ${role}`;
  } catch (error) {
    authStatus.textContent = `Erro no cadastro: ${error.message}`;
  }
});

$("btnLogin").addEventListener("click", async () => {
  if (!(await ensureFirebaseInitialized())) return;

  const email = $("email").value.trim();
  const password = $("password").value;

  try {
    const { signInWithEmailAndPassword, ref, update } = window._firebaseFns;

    const cred = await signInWithEmailAndPassword(auth, email, password);

    await update(ref(db, `users/${cred.user.uid}`), {
      lastLoginAt: Date.now()
    });

    authStatus.textContent = `Login realizado com sucesso: ${email}`;
  } catch (error) {
    authStatus.textContent = `Erro no login: ${error.message}`;
  }
});

$("btnLogout").addEventListener("click", async () => {
  if (!(await ensureFirebaseInitialized())) return;

  try {
    const { signOut } = window._firebaseFns;
    await signOut(auth);
    authStatus.textContent = "Logout realizado.";

    userAccessPill.className = "pill no";
    userAccessPill.textContent = "Não testado";

    adminAccessPill.className = "pill no";
    adminAccessPill.textContent = "Não testado";

    userDataOutput.textContent = "Sem dados ainda.";
    adminDataOutput.textContent = "Sem dados ainda.";
  } catch (error) {
    authStatus.textContent = `Erro no logout: ${error.message}`;
  }
});

$("btnReadProfile").addEventListener("click", async () => {
  if (!(await ensureFirebaseInitialized())) return;

  if (!auth.currentUser) {
    alert("Faça login primeiro.");
    return;
  }

  try {
    const { ref, get } = window._firebaseFns;
    const snap = await get(ref(db, `users/${auth.currentUser.uid}`));

    userDataOutput.textContent = JSON.stringify(snap.val(), null, 2);
    setPillState(userAccessPill, true);
  } catch (error) {
    userDataOutput.textContent = error.message;
    setPillState(userAccessPill, false);
  }
});

$("btnUpdateProfile").addEventListener("click", async () => {
  if (!(await ensureFirebaseInitialized())) return;

  if (!auth.currentUser) {
    alert("Faça login primeiro.");
    return;
  }

  try {
    const { ref, update } = window._firebaseFns;

    await update(ref(db, `users/${auth.currentUser.uid}`), {
      lastLoginAt: Date.now()
    });

    userDataOutput.textContent = JSON.stringify(
      { ok: true, message: "lastLoginAt atualizado" },
      null,
      2
    );

    setPillState(userAccessPill, true);
  } catch (error) {
    userDataOutput.textContent = error.message;
    setPillState(userAccessPill, false);
  }
});

$("btnReadAdmin").addEventListener("click", async () => {
  if (!(await ensureFirebaseInitialized())) return;

  if (!auth.currentUser) {
    alert("Faça login primeiro.");
    return;
  }

  try {
    const { ref, get } = window._firebaseFns;
    const snap = await get(ref(db, "admin-data"));

    adminDataOutput.textContent = JSON.stringify(snap.val(), null, 2);
    setPillState(adminAccessPill, true);
  } catch (error) {
    adminDataOutput.textContent = error.message;
    setPillState(adminAccessPill, false);
  }
});

$("btnWriteAdmin").addEventListener("click", async () => {
  if (!(await ensureFirebaseInitialized())) return;

  if (!auth.currentUser) {
    alert("Faça login primeiro.");
    return;
  }

  try {
    const { ref, update } = window._firebaseFns;

    await update(ref(db, "admin-data"), {
      dashboardMessage: "Atualizado pela interface web.",
      lastUpdatedBy: auth.currentUser.uid,
      updatedAt: Date.now()
    });

    adminDataOutput.textContent = JSON.stringify(
      { ok: true, message: "admin-data atualizado" },
      null,
      2
    );

    setPillState(adminAccessPill, true);
  } catch (error) {
    adminDataOutput.textContent = error.message;
    setPillState(adminAccessPill, false);
  }
});