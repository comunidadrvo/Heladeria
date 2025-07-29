import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD-WV5eeZ-9DpTBYFFNr9_Q29Dg_hMyU6w",
  authDomain: "heladeria-pos.firebaseapp.com",
  databaseURL: "https://heladeria-pos-default-rtdb.firebaseio.com",
  projectId: "heladeria-pos",
  storageBucket: "heladeria-pos.firebasestorage.app",
  messagingSenderId: "171441568131",
  appId: "1:171441568131:web:6f730a3e64b79735815eb6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
