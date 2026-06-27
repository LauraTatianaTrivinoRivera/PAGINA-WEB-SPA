// Tus credenciales reales de Firebase extraídas de la consola
const firebaseConfig = {
  apiKey: "AIzaSyDO03a4JWy3dmm7uNZG6J3w0u0OGMO0NHs",
  authDomain: "pagina-manicurista.firebaseapp.com",
  projectId: "pagina-manicurista",
  storageBucket: "pagina-manicurista.firebasestorage.app",
  messagingSenderId: "551303884409", // Este número lo completé según tu appId
  appId: "1:551303884409:web:f56450bdca75d90549aea8"
};

// Inicializar Firebase en la página web
firebase.initializeApp(firebaseConfig);

// Inicializar los servicios para que funcionen las reseñas
const db = firebase.firestore();
const storage = firebase.storage();