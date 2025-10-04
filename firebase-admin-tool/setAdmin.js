//firebase-admin-tool/setAdmin.js
const admin = require("firebase-admin");

// Load service account key
const serviceAccount = require("./serviceAccountKey.json");

// Init Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Danh sách UID muốn set admin
const adminUIDs = [
  "0iEAs0txBhg7ks4CLlSBKBVvdTk2",
  "P7VpPKyi9hVYYDMIGkS9qXPja8Y2"
];

// Hàm gán admin claim
async function setAdminClaims(uids) {
  for (const uid of uids) {
    try {
      await admin.auth().setCustomUserClaims(uid, { admin: true });
      console.log(` Đã set admin cho: ${uid}`);
    } catch (error) {
      console.error(` Lỗi khi set admin cho ${uid}:`, error);
    }
  }
}

// Gọi hàm này với UID của tài khoản admin
setAdminClaims(adminUIDs);
