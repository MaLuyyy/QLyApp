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
const parseValue = (v: any): any => {
  if (!v) return null;

  if (v.mapValue) {
    const fields = v.mapValue.fields || {};
    return Object.fromEntries(Object.entries(fields).map(([k, val]) => [k, parseValue(val)]));
  }

  if (v.arrayValue) {
    const values = v.arrayValue.values || [];
    return values.map((val: any) => parseValue(val));
  }

  if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
  if (v.doubleValue !== undefined) return parseFloat(v.doubleValue);
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.timestampValue !== undefined) return v.timestampValue;

  return v; // fallback
};

// Helper để chuyển JS value → Firestore field format
const toFirestoreValue = (value: any): any => {
  if (value === null || value === undefined) return { nullValue: null };

  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "number") return Number.isInteger(value)
    ? { integerValue: value }
    : { doubleValue: value };
  if (typeof value === "boolean") return { booleanValue: value };

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((v) => toFirestoreValue(v)),
      },
    };
  }

  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value).map(([k, v]) => [k, toFirestoreValue(v)])
        ),
      },
    };
  }

  return { stringValue: String(value) }; // fallback
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
    Object.entries(data).map(([k, v]) => [k, toFirestoreValue(v)])
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

export const countOrdersByUserId = async (userId: string) => {
  const token = await getToken();
  const url = `${baseUrl}:runQuery`;

  const body = {
    structuredQuery: {
      from: [{ collectionId: "orders" }],
      where: {
        compositeFilter: {
          op: "AND",
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: "userId" },
                op: "EQUAL",
                value: { stringValue: userId },
              },
            },
            {
              fieldFilter: {
                field: { fieldPath: "status" },
                op: "EQUAL",
                value: { stringValue: "completed" },
              },
            },
          ],
        },
      },
      select: { fields: [] },
    },
  };

  try {
    const res = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const documents = res.data.filter((item: any) => item.document);
    return documents.length;
  } catch (error: any) {
    return 0;
  }
};

