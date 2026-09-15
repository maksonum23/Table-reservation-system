import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig = {};
try {
  firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
} catch (e) {
  console.warn("Could not read config");
}

console.log("Config", firebaseConfig);

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId || '(default)');

async function run() {
  try {
    const docRef = doc(db, "reservations", "testdoc");
    await setDoc(docRef, { ok: true });
    console.log("Success");
  } catch (e) {
    console.error("Firestore Error:", e);
  }
}

run();
