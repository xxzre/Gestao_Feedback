import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 1) Vá em https://console.firebase.google.com, crie um projeto (gratuito).
// 2) No projeto, clique no ícone "</>" para adicionar um app Web.
// 3) Copie os valores que aparecerem e cole abaixo, no lugar dos SEU_...
// 4) No menu lateral, vá em "Firestore Database" -> "Criar banco de dados"
//    (pode escolher o modo de produção; ajustaremos as regras no README).
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
