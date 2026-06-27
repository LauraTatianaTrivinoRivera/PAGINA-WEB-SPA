/**
 * CONFIGURACIÓN FIREBASE - Reseñas en la nube
 * =============================================
 * Para que las reseñas se vean en celulares, tablets y computadores:
 *
 * 1. Entra a https://console.firebase.google.com y crea un proyecto gratis
 * 2. Agrega una app Web (icono </>) y copia la configuración aquí abajo
 * 3. En el menú lateral: Firestore Database → Crear base de datos (modo producción)
 * 4. En Storage → Empezar
 * 5. En Reglas de Firestore, pega las reglas indicadas al final de este archivo
 * 6. En Reglas de Storage, pega las reglas indicadas al final de este archivo
 *
 * REGLAS FIRESTORE (Firestore → Reglas):
 * --------------------------------------
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /reviews/{reviewId} {
 *       allow read: if true;
 *       allow create: if request.resource.data.keys().hasAll(['name', 'text', 'rating', 'createdAt'])
 *         && request.resource.data.rating is number
 *         && request.resource.data.rating >= 1 && request.resource.data.rating <= 5
 *         && request.resource.data.name is string
 *         && request.resource.data.name.size() > 0 && request.resource.data.name.size() <= 40
 *         && request.resource.data.text is string
 *         && request.resource.data.text.size() > 0 && request.resource.data.text.size() <= 400
 *         && (!('location' in request.resource.data) || request.resource.data.location is string)
 *         && (!('imageUrl' in request.resource.data) || request.resource.data.imageUrl is string);
 *       allow update, delete: if false;
 *     }
 *   }
 * }
 *
 * REGLAS STORAGE (Storage → Reglas):
 * ----------------------------------
 * rules_version = '2';
 * service firebase.storage {
 *   match /b/{bucket}/o {
 *     match /review-images/{fileName} {
 *       allow read: if true;
 *       allow write: if request.resource.size < 5 * 1024 * 1024
 *         && request.resource.contentType.matches('image/.*');
 *     }
 *   }
 * }
 */

window.MANICURE_FIREBASE_CONFIG = {
  apiKey: 'TU_API_KEY',
  authDomain: 'tu-proyecto.firebaseapp.com',
  projectId: 'tu-proyecto-id',
  storageBucket: 'tu-proyecto-id.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:xxxxxxxxxxxxxxxx'
};
