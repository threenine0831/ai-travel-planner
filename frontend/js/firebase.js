let servicesPromise = null;
let configPromise = null;
let sdkPromise = null;

async function loadFirebaseConfig() {
  if (!configPromise) {
    configPromise = import("./firebase-config.js")
      .then((module) => module.firebaseConfig || null)
      .catch(() => null);
  }
  return configPromise;
}

export async function isFirebaseConfigured() {
  const config = await loadFirebaseConfig();
  return Boolean(config && config.apiKey && !String(config.apiKey).startsWith("YOUR_"));
}

export async function getFirebaseSdk() {
  if (!sdkPromise) {
    sdkPromise = Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"),
    ]).then(([appModule, authModule, firestoreModule]) => ({
      ...appModule,
      ...authModule,
      ...firestoreModule,
    }));
  }
  return sdkPromise;
}

export async function getFirebaseServices() {
  if (!servicesPromise) {
    servicesPromise = (async () => {
      const config = await loadFirebaseConfig();
      if (!config || !config.apiKey || String(config.apiKey).startsWith("YOUR_")) {
        const error = new Error("Firebase 설정 파일이 필요합니다.");
        error.code = "FIREBASE_CONFIG_MISSING";
        throw error;
      }
      const { initializeApp, getApps, getAuth, getFirestore } = await getFirebaseSdk();
      const app = getApps().length ? getApps()[0] : initializeApp(config);
      return {
        app,
        auth: getAuth(app),
        db: getFirestore(app),
      };
    })();
  }
  return servicesPromise;
}

export function getFirebaseErrorMessage(error) {
  const code = error?.code || "";
  const messages = {
    "auth/email-already-in-use": "이미 가입된 이메일입니다.",
    "auth/invalid-email": "이메일 형식이 올바르지 않습니다.",
    "auth/invalid-credential": "이메일 또는 비밀번호가 올바르지 않습니다.",
    "auth/user-not-found": "가입된 사용자를 찾을 수 없습니다.",
    "auth/wrong-password": "비밀번호가 올바르지 않습니다.",
    "auth/weak-password": "비밀번호는 6자 이상이어야 합니다.",
    "auth/too-many-requests": "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
    "auth/operation-not-allowed": "Firebase Authentication에서 이메일/비밀번호 로그인을 활성화해 주세요.",
    "auth/admin-restricted-operation": "Firebase Authentication에서 이메일/비밀번호 로그인을 활성화해 주세요.",
    "auth/unauthorized-domain": "Firebase Authentication 승인된 도메인에 현재 사이트 주소를 추가해 주세요.",
    "auth/network-request-failed": "Firebase에 연결하지 못했습니다. 네트워크 또는 도메인 설정을 확인해 주세요.",
    "permission-denied": "Firestore 권한이 없습니다. 로그인 상태와 보안 규칙을 확인해 주세요.",
    "unavailable": "Firebase 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    FIREBASE_CONFIG_MISSING: "Firebase 설정이 필요합니다. js/firebase-config.example.js를 복사해 js/firebase-config.js를 만든 뒤 값을 입력해 주세요.",
  };
  return messages[code] || "작업을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}
