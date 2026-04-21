let app = null;
let auth = null;
let db = null;
let firebaseReady = false;
let authListenerAttached = false;

const $ = (id) => document.getElementById(id);

const configStatus = $("configStatus");
const authStatus = $("authStatus");

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

async function getFirebaseModules() {
  const [
    { initializeApp, getApps, getApp },
    {
      getAuth,
      onAuthStateChanged,
      createUserWithEmailAndPassword,
      signInWithEmailAndPassword
    },
    { getDatabase, ref, set, get, update }
  ] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js")
  ]);

  return {
    initializeApp,
    getApps,
    getApp,
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    getDatabase,
    ref,
    set,
    get,
    update
  };
}

async function initializeFirebase(parsedConfig) {
  const modules = await getFirebaseModules();

  app = modules.getApps().length ? modules.getApp() : modules.initializeApp(parsedConfig);
  auth = modules.getAuth(app);
  db = modules.getDatabase(app);
  firebaseReady = true;

  window._firebaseFns = modules;

  localStorage.setItem("firebaseConfig", JSON.stringify(parsedConfig));

  configStatus.textContent =
    "Firebase inicializado com sucesso. Agora você já pode cadastrar ou entrar.";
  $("btnInit").disabled = true;
  $("btnInit").textContent = "Firebase inicializado";

  if (!authListenerAttached) {
    modules.onAuthStateChanged(auth, async (user) => {
      if (!user) {
        authStatus.textContent = "Nenhum usuário autenticado.";
        return;
      }

      try {
        const snap = await modules.get(modules.ref(db, `users/${user.uid}`));

        if (!snap.exists()) {
          authStatus.textContent = "Usuário autenticado, mas sem perfil salvo no banco.";
          return;
        }

        const role = snap.val().role;
        authStatus.textContent = `Autenticado: ${user.email} (${role})`;
      } catch (error) {
        authStatus.textContent = `Erro ao verificar perfil: ${error.message}`;
      }
    });

    authListenerAttached = true;
  }
}

$("btnInit").addEventListener("click", async () => {
  try {
    if (firebaseReady) {
      configStatus.textContent = "Firebase já foi inicializado.";
      return;
    }

    const parsedConfig = JSON.parse($("firebaseConfig").value);
    await initializeFirebase(parsedConfig);
  } catch (error) {
    configStatus.textContent = `Erro ao inicializar: ${error.message}`;
  }
});

$("btnRegister").addEventListener("click", async () => {
  if (!firebaseReady) {
    alert("Inicialize o Firebase primeiro.");
    return;
  }

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

    authStatus.textContent = `Conta criada com sucesso para ${email}. Redirecionando...`;

    if (role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "user.html";
    }
  } catch (error) {
    authStatus.textContent = `Erro no cadastro: ${error.message}`;
  }
});

$("btnLogin").addEventListener("click", async () => {
  if (!firebaseReady) {
    alert("Inicialize o Firebase primeiro.");
    return;
  }

  const email = $("email").value.trim();
  const password = $("password").value;

  try {
    const { signInWithEmailAndPassword, ref, update, get } = window._firebaseFns;

    const cred = await signInWithEmailAndPassword(auth, email, password);

    await update(ref(db, `users/${cred.user.uid}`), {
      lastLoginAt: Date.now()
    });

    const snap = await get(ref(db, `users/${cred.user.uid}`));

    if (!snap.exists()) {
      authStatus.textContent = "Login realizado, mas o perfil não foi encontrado no banco.";
      return;
    }

    const role = snap.val().role;
    authStatus.textContent = `Login realizado com sucesso: ${email}. Redirecionando...`;

    if (role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "user.html";
    }
  } catch (error) {
    authStatus.textContent = `Erro no login: ${error.message}`;
  }
});

window.addEventListener("DOMContentLoaded", () => {
  const savedConfig = localStorage.getItem("firebaseConfig");
  if (savedConfig) {
    $("firebaseConfig").value = savedConfig;
  }
});
