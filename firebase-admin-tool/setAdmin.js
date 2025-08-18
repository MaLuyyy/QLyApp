const admin = require("firebase-admin");

// Load service account key
const serviceAccount = require("./serviceAccountKey.json");

// Init Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Hàm gán admin claim
async function setAdminClaim(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`✅ Thiết lập thành công Admin cho: ${uid}`);
  } catch (error) {
    console.error("❌ Lỗi thiết lập:", error);
  }
}

// Gọi hàm này với UID của tài khoản admin
setAdminClaim("0iEAs0txBhg7ks4CLlSBKBVvdTk2");
