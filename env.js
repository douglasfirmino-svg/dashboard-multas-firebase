// ============================================
// ENV.JS - Carrega variáveis de ambiente do config.json
// ============================================

// Função assíncrona pra carregar config.json
async function carregarConfiguracao() {
  try {
    const response = await fetch('config.json');
    window.ENV = await response.json();
    console.log('✅ Configuração carregada do config.json');
  } catch (erro) {
    console.warn('⚠️ Erro ao carregar config.json, usando valores vazios', erro);
    window.ENV = {
      VITE_FIREBASE_API_KEY: '',
      VITE_FIREBASE_AUTH_DOMAIN: '',
      VITE_FIREBASE_PROJECT_ID: '',
      VITE_FIREBASE_STORAGE_BUCKET: '',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '',
      VITE_FIREBASE_APP_ID: '',
      VITE_CLOUDINARY_CLOUD_NAME: '',
      VITE_CLOUDINARY_UPLOAD_PRESET: '',
      VITE_EMAILJS_PUBLIC_KEY: '',
      VITE_EMAILJS_SERVICE_ID: '',
      VITE_EMAILJS_TEMPLATE_ID: ''
    };
  }
}

// Carrega a configuração imediatamente
carregarConfiguracao();
