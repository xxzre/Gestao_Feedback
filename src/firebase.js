import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 1) Vá em https://console.firebase.google.com, crie um projeto (gratuito).
// 2) No projeto, clique no ícone "</>" para adicionar um app Web.
// 3) Copie os valores que aparecerem e cole abaixo, no lugar dos SEU_...
// 4) No menu lateral, vá em "Firestore Database" -> "Criar banco de dados"
//    (pode escolher o modo de produção; ajustaremos as regras no README).
const firebaseConfig = {
  apiKey: "AIzaSyCHBrmr39kmk48fZj3oHA1-Y52_EJMnohI",
  authDomain: "gestao-feedback.firebaseapp.com",
  projectId: "gestao-feedback",
  storageBucket: "gestao-feedback.firebasestorage.app",
  messagingSenderId: "274359550576",
  appId: "1:274359550576:web:9d19fffec993eed7c62ab5",
  measurementId: "G-TW2MRWYPEP"
};

export const isFirebaseConfigured =
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "SUA_API_KEY" &&
  firebaseConfig.apiKey.trim() !== "";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
