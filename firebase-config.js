// ============================================
// CONFIGURAÇÃO FIREBASE
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Lê variáveis de ambiente (Vercel injeta automaticamente)
// No desenvolvimento local, copie as credenciais do .env.example para o .env
const firebaseConfig = {
  apiKey: import.meta?.env?.VITE_FIREBASE_API_KEY || "AIzaSyDJNswkZP8TIdVg8HWQMAWNGrSQguvxhT0",
  authDomain: import.meta?.env?.VITE_FIREBASE_AUTH_DOMAIN || "painel-multas.firebaseapp.com",
  projectId: import.meta?.env?.VITE_FIREBASE_PROJECT_ID || "painel-multas",
  storageBucket: import.meta?.env?.VITE_FIREBASE_STORAGE_BUCKET || "painel-multas.firebasestorage.app",
  messagingSenderId: import.meta?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "775351533797",
  appId: import.meta?.env?.VITE_FIREBASE_APP_ID || "1:775351533797:web:5811fba13febe42171540c"
};

// Cloudinary config
const cloudinaryConfig = {
  cloudName: import.meta?.env?.VITE_CLOUDINARY_CLOUD_NAME || "uv7nwlbc",
  uploadPreset: import.meta?.env?.VITE_CLOUDINARY_UPLOAD_PRESET || "xmo2bznb"
};

// Inicializar Firebase
try {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  console.log('✅ Firebase conectado com sucesso!');
  window.db = db; // Tornar global para o app.js usar
  window.cloudinaryConfig = cloudinaryConfig; // Passar config do Cloudinary também
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase:', error);
}
