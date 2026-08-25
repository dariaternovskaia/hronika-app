import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { getDatabase, ref, set, get, onValue, remove, update } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyCdQ9FwLCMjaqBtXUEJFRCh0jbt-sSdg8",
  authDomain: "hronika-app.firebaseapp.com",
  databaseURL: "https://hronika-app-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "hronika-app",
  storageBucket: "hronika-app.firebasestorage.app",
  messagingSenderId: "972914332558",
  appId: "1:972914332558:web:1e950aa0068326f1ae8adf",
  measurementId: "G-BYGVESDQLY"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Делаем доступным для обычных скриптов
window.firebaseDB = db;
window.firebaseRef = ref;
window.firebaseSet = set;
window.firebaseGet = get;
window.firebaseOnValue = onValue;
window.firebaseRemove = remove;
window.firebaseUpdate = update;

console.log('✅ Firebase подключён и готов к работе');