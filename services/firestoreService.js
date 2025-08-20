// services/firestore
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebaseConfig";


export const getAllDocuments = async (collectionName) => {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map(docItem => ({ id: docItem.id, ...docItem.data() }));
};


export const addDocument = async (collectionName, data) => {
  const docRef = await addDoc(collection(db, collectionName), data);
  return docRef.id;
};


export const updateDocument = async (collectionName, id, data) => {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, data);
};


export const deleteDocument = async (collectionName, id) => {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
};
