// ============================================
// CONFIGURAÇÃO FIREBASE 
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDJNswkZP8TIdVg8HWQMAWNGrSQguvxhT0",
  authDomain: "painel-multas.firebaseapp.com",
  projectId: "painel-multas",
  storageBucket: "painel-multas.firebasestorage.app",
  messagingSenderId: "775351533797",
  appId: "1:775351533797:web:5811fba13febe42171540c"
};

// Inicializar Firebase
try {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  console.log('✅ Firebase conectado com sucesso!');
  window.db = db; // Tornar global para o app.js usar
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase:', error);
}
