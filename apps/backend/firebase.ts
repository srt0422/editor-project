import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import serviceAccount from "./serviceAccountKey.json";

initializeApp({
  credential: cert(<any>serviceAccount),
  databaseURL: "https://databaseName.firebaseio.com",
});

export default getFirestore();

export const counter = FieldValue.increment;