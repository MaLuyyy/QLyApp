// services/firestoreService.ts
import axios from "axios";
import { auth } from "../lib/firebaseConfig";

const projectId = "shopapp-d465b";
const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

// Hàm tiện ích lấy token
const getToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("Chưa đăng nhập");
  return await user.getIdToken();
};

// Helper parse giá trị Firestore -> JS
const parseValue = (v: any) => {
  const [type, value] = Object.entries(v)[0];
  if (type === "integerValue") return parseInt(value as string, 10);
  if (type === "doubleValue") return parseFloat(value as string);
  if (type === "booleanValue") return Boolean(value);
  return value; // stringValue, timestampValue,...
};

// Lấy tất cả documents
export const getAllDocuments = async (collectionName: string, pageSize = 100) => {
  const token = await getToken();
  const res = await axios.get(`${baseUrl}/${collectionName}?pageSize=${pageSize}`, {
    headers: { Authorization: `Bearer ${token}` },
  });


  if (!res.data.documents) return [];

  const docs = res.data.documents.map((doc: any) => {
    const parsedDoc = {
      id: doc.name.split("/").pop(),
      ...Object.fromEntries(
        Object.entries(doc.fields || {}).map(([k, v]: any) => [k, parseValue(v)])
      ),
    };
    return parsedDoc;
  });

  return docs;
};

// Lấy 1 document theo ID
export const getDocumentById = async (collectionName: string, id: string) => {
  const token = await getToken();

  const res = await axios.get(`${baseUrl}/${collectionName}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const doc = res.data;

  if (!doc || !doc.fields) throw new Error("Không tìm thấy document");

  // Parse dữ liệu Firestore -> JS object
  const parsedDoc = {
    id: doc.name.split("/").pop(),
    ...Object.fromEntries(
      Object.entries(doc.fields).map(([k, v]: any) => [k, parseValue(v)])
    ),
  };

  return parsedDoc;
};

// 🧩 Lấy documents có phân trang
export const getDocumentsWithPagination = async (
  collectionName: string,
  pageSize = 10,
  pageToken?: string
) => {
  const token = await getToken();

  let url = `${baseUrl}/${collectionName}?pageSize=${pageSize}`;
  if (pageToken) url += `&pageToken=${pageToken}`;

  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.data.documents) {
    return { documents: [], nextPageToken: null };
  }

  const documents = res.data.documents.map((doc: any) => ({
    id: doc.name.split("/").pop(),
    ...Object.fromEntries(
      Object.entries(doc.fields || {}).map(([k, v]: any) => [k, parseValue(v)])
    ),
  }));

  return {
    documents,
    nextPageToken: res.data.nextPageToken || null,
  };
};

// Thêm document
export const addDocument = async (collectionName: string, data: any) => {
  const token = await getToken();

  const fields = Object.fromEntries(
    Object.entries(data).map(([k, v]) => {
      if (typeof v === "number") return [k, { integerValue: v }];
      if (typeof v === "boolean") return [k, { booleanValue: v }];
      return [k, { stringValue: v }];
    })
  );

  const res = await axios.post(
    `${baseUrl}/${collectionName}`,
    { fields },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data.name?.split("/").pop();
};

// Cập nhật document
export const updateDocument = async (collectionName: string, id: string, data: any) => {
  const token = await getToken();

  const fields = Object.fromEntries(
    Object.entries(data).map(([k, v]) => {
      if (typeof v === "number") return [k, { integerValue: v }];
      if (typeof v === "boolean") return [k, { booleanValue: v }];
      return [k, { stringValue: v }];
    })
  );

  const updateMask = Object.keys(data)
    .map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`)
    .join("&");

  const res = await axios.patch(
    `${baseUrl}/${collectionName}/${id}?${updateMask}`,
    { fields },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data;
};

// Xóa document
export const deleteDocument = async (collectionName: string, id: string) => {
  const token = await getToken();
  await axios.delete(`${baseUrl}/${collectionName}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
