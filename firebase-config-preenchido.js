// ============================================
// CONFIGURAÇÃO FIREBASE - PREENCHIDO
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyDJNswkZP8TIdVg8HWQMAWNGrSQguvxhT0",
  authDomain: "painel-multas.firebaseapp.com",
  projectId: "painel-multas",
  storageBucket: "painel-multas.firebasestorage.app",
  messagingSenderId: "775351533797",
  appId: "1:775351533797:web:5811fba13febe42171540c"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

console.log('✅ Firebase configurado com sucesso!');
