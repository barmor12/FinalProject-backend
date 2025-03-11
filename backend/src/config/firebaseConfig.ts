import admin from "firebase-admin";
import { Storage } from "@google-cloud/storage";
import path from "path";

// ייבוא ה-Service Account JSON
const serviceAccount = require(path.resolve(__dirname, "../config/firebaseServiceAccountKey.json"));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "cakemanager-747fb.firebasestorage.app", // שנה ל-Bucket שלך
});

const bucket = admin.storage().bucket();

export default bucket;
