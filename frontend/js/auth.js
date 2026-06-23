import { getFirebaseErrorMessage, getFirebaseSdk, getFirebaseServices } from "./firebase.js";

export function onUserStateChange(callback) {
  let unsubscribe = () => {};
  Promise.all([getFirebaseServices(), getFirebaseSdk()])
    .then(([{ auth }, { onAuthStateChanged }]) => {
      unsubscribe = onAuthStateChanged(auth, callback, () => callback(null));
    })
    .catch((error) => {
      callback(null, error);
    });
  return () => unsubscribe();
}

export async function waitForUser() {
  try {
    const { auth } = await getFirebaseServices();
    const { onAuthStateChanged } = await getFirebaseSdk();
    return await new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          unsubscribe();
          resolve(user);
        },
        () => {
          unsubscribe();
          resolve(null);
        },
      );
    });
  } catch {
    return null;
  }
}

export async function getCurrentIdToken() {
  const user = await waitForUser();
  if (!user) {
    const error = new Error("로그인이 필요합니다.");
    error.code = "AUTH_REQUIRED";
    throw error;
  }
  const { getIdToken } = await getFirebaseSdk();
  return getIdToken(user, true);
}

export async function signUpWithEmail({ email, password, displayName }) {
  const { auth, db } = await getFirebaseServices();
  const {
    createUserWithEmailAndPassword,
    doc,
    serverTimestamp,
    setDoc,
    updateProfile,
  } = await getFirebaseSdk();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  await setDoc(doc(db, "users", credential.user.uid), {
    displayName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return credential.user;
}

export async function signInWithEmail({ email, password }) {
  const { auth } = await getFirebaseServices();
  const { signInWithEmailAndPassword } = await getFirebaseSdk();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logoutUser() {
  const { auth } = await getFirebaseServices();
  const { signOut } = await getFirebaseSdk();
  await signOut(auth);
  sessionStorage.removeItem("tripPlanner:draft");
  sessionStorage.removeItem("tripPlanner:result");
  sessionStorage.removeItem("tripPlanner:savedDocId");
}

export function authErrorMessage(error) {
  if (error?.code === "AUTH_REQUIRED") {
    return "로그인이 필요합니다. 로그인 후 다시 시도해 주세요.";
  }
  return getFirebaseErrorMessage(error);
}
