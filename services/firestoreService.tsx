// services/firestoreService.tsx
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

type FirestoreDoc = { id?: string; [key: string]: any };

const getAllDocuments = async <T = any>(collectionName: string): Promise<(T & { id: string })[]> => {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T & { id: string }));
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    return [];
  }
};

const addDocument = async (collectionName: string, data: FirestoreDoc): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    return null;
  }
};

const updateDocument = async (collectionName: string, id: string, data: Partial<FirestoreDoc>) => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error(`Error updating document ${id} in ${collectionName}:`, error);
  }
};

const deleteDocument = async (collectionName: string, id: string) => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document ${id} from ${collectionName}:`, error);
  }
};

export const firestoreService = {
  getAllDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
};
