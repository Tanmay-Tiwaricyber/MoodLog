import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getDatabase } from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyA0s9vHEkDR0lWEXIsI8TvcHHjX9TQ5xXk",
  authDomain: "connectchat-d3713.firebaseapp.com",
  databaseURL: "https://connectchat-d3713-default-rtdb.firebaseio.com",
  projectId: "connectchat-d3713",
  storageBucket: "connectchat-d3713.firebasestorage.app",
  messagingSenderId: "393420495514",
  appId: "1:393420495514:web:4ff7e73efe3d68172f5d23",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const database = getDatabase(app)
export default app
