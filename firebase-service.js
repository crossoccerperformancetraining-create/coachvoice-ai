let app = null;
let auth = null;
let db = null;
let currentUser = null;
let ready = false;

export async function initFirebase(onUserChanged){
  try{
    const { firebaseConfig } = await import('./firebase-config.js');
    const appMod = await import('https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js');
    const authMod = await import('https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js');
    const fsMod = await import('https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js');

    app = appMod.initializeApp(firebaseConfig);
    auth = authMod.getAuth(app);
    db = fsMod.getFirestore(app);
    ready = true;

    authMod.onAuthStateChanged(auth, user => {
      currentUser = user;
      onUserChanged?.(user);
    });
  }catch(err){
    console.info('Firebase não configurado; modo demonstração ativo.', err.message);
    onUserChanged?.(null);
  }
}

export function isFirebaseReady(){ return ready; }

export async function registerWithEmail(email,password){
  if(!ready) throw new Error('Configure o Firebase primeiro.');
  if(!email || !password) throw new Error('Informe e-mail e senha.');
  const { createUserWithEmailAndPassword } =
    await import('https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js');
  return createUserWithEmailAndPassword(auth,email,password);
}

export async function loginWithEmail(email,password){
  if(!ready) throw new Error('Configure o Firebase primeiro.');
  if(!email || !password) throw new Error('Informe e-mail e senha.');
  const { signInWithEmailAndPassword } =
    await import('https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js');
  return signInWithEmailAndPassword(auth,email,password);
}

export async function loginWithGoogle(){
  if(!ready) throw new Error('Configure o Firebase primeiro.');
  const { GoogleAuthProvider, signInWithPopup } =
    await import('https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js');
  return signInWithPopup(auth,new GoogleAuthProvider());
}

export async function logoutUser(){
  if(!ready || !auth) return;
  const { signOut } =
    await import('https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js');
  await signOut(auth);
}

export async function saveCloudProgress(completedLessons){
  if(!ready || !currentUser) throw new Error('Entre na sua conta.');
  const { doc, setDoc, serverTimestamp } =
    await import('https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js');
  await setDoc(doc(db,'users',currentUser.uid),{
    email: currentUser.email || '',
    completedLessons,
    updatedAt: serverTimestamp()
  },{merge:true});
}

export async function loadCloudProgress(){
  if(!ready || !currentUser) return [];
  const { doc, getDoc } =
    await import('https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js');
  const snap = await getDoc(doc(db,'users',currentUser.uid));
  return snap.exists() ? (snap.data().completedLessons || []) : [];
}
