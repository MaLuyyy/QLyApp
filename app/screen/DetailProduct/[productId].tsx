import EditProductModal from "@/app/components/product/EditProductModal";
import { Product } from "@/app/types/product";
import { deleteDocument, getDocumentById, updateDocument } from "@/services/firestoreService";
import { getCategoryFromName } from "@/utils/helpers";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, Image, Modal, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [product, setProduct] = useState<Product | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newQuantity, setNewQuantity] = useState("");
  const [imageHeight, setImageHeight] = useState(300);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      getDocumentById("products", productId)
        .then((data) => {
          setProduct(data);
          setIsAvailable(data?.quantity > 0);
        })
        .finally(() => setLoading(false));
    }
  }, [productId]);
  
  useEffect(() => {
    if (product?.image) {
      Image.getSize(product.image, (width, height) => {
        const screenWidth = Dimensions.get("window").width;
        const scale = width / screenWidth;
        const scaledHeight = height / scale;
        setImageHeight(scaledHeight);
      });
    }
  }, [product?.image]);
  
  const handleToggleSwitch = async () => {
    if (!product?.id) return;
  
    if (isAvailable) {
      // 🔴 Đang bật → tắt (hết hàng)
      setIsAvailable(false);
      const updated = { ...product, quantity: 0, updateAt: new Date().toISOString()  };
      setProduct(updated);
      await updateDocument("products", product.id, { 
        quantity: 0,
        updateAt: new Date().toISOString()
      });
      Toast.show({
        type: "info",
        text1: "Đã chuyển sản phẩm sang trạng thái hết hàng",
        position: "top",
      });
    } else {
      // 🟢 Đang tắt → bật (mở modal nhập số lượng mới)
      setModalVisible(true);
    }
  };
  

  const handleConfirmQuantity = async () => {
    const qty = Number(newQuantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập số lượng hợp lệ (> 0)");
      return;
    }
  
    try {
      setIsAvailable(true);
      setProduct((prev) => prev ? { ...prev, quantity: qty, updateAt: new Date().toISOString() } : prev);
      setModalVisible(false);
      setNewQuantity("");
  
      if (product?.id) {
        await updateDocument("products", product.id, { 
          quantity: qty,
          updateAt: new Date().toISOString()
        });
        Toast.show({
          type: "success",
          text1: "Cập nhật số lượng thành công",
          position: "top",
        });
      }
    } catch (error) {
      console.error("❌ Lỗi khi lưu Firestore:", error);
      Alert.alert("Lỗi", "Không thể lưu số lượng. Vui lòng thử lại.");
    }
  };
  

  
  const handleDelete = () => {
    if (!product?.id) return;
    Alert.alert(
      "Xác nhận",
      `Bạn có chắc muốn xóa "${product?.name}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", style: "destructive",
          onPress: async() => {
            try{
              await deleteDocument("products", product?.id);
              Toast.show({
                type: "success",
                text1: "Xóa món ăn thành công",
                position: "top"
              })
              router.back();
            }
            catch(error){
              console.error("Lỗi khi xóa sản phẩm:", error);
              Alert.alert("Lỗi", "Không thể xóa sản phẩm. Vui lòng thử lại.");
            }
          }
        },
      ]
    );
  };
  
  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#B91C1C" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text>Không tìm thấy sản phẩm</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Status bar */}
      <StatusBar backgroundColor="#B91C1C" barStyle="light-content" translucent={false}/>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={25} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Image source={{ uri: product.image }} style={{ width: "100%", height: imageHeight, resizeMode: "contain" }} />
        <View style={{ padding: 16 }}>
        <View style={styles.card}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{product.name}</Text>
          <Switch
            value={isAvailable}
            onValueChange={handleToggleSwitch}
            thumbColor={isAvailable ? "#22c55e" : "#dc2626"}
            trackColor={{ false: "#fca5a5", true: "#86efac" }}
          />
        </View>

          <View style={styles.row}>
            <Text style={styles.label}>Danh mục:</Text>
            <Text style={styles.category}>{getCategoryFromName(product.category)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Giá bán:</Text>
            <Text style={styles.price}>{product.price.toLocaleString()}đ</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Tồn kho:</Text>
            <Text
              style={[
                styles.stock,
                {
                  color:
                    product.quantity === 0
                      ? "#DC2626" // đỏ nếu hết hàng
                      : product.quantity <= 10
                      ? "#F97316" // cam nếu sắp hết
                      : "#7CFC00", // xanh nếu nhiều
                },
              ]}
            >
              {product.quantity} phần
            </Text>
          </View>
        </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={18} color="#B91C1C" />
              <Text style={styles.sectionTitle}>Mô tả</Text>
            </View>
            <Text style={styles.text}>{product.description}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle-outline" size={18} color="#B91C1C" />
              <Text style={styles.sectionTitle}>Thông tin thêm</Text>
            </View>
            <View style={styles.Date}>
              <Text style={styles.text}>Ngày tạo:</Text>
              <Text style={styles.text}>
                {" "}
                {product.createAt
                  ? new Date(product.createAt).toLocaleString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "—"}
              </Text> 
            </View>           
            <View style={styles.Date}>
              <Text style={styles.text}>Cập nhật lần cuối:</Text>
              <Text style={styles.text}>
                {" "}
                {product.updateAt
                  ? new Date(product.updateAt).toLocaleString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "—"}
              </Text> 
            </View>           
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: "#F97316" }]}
          onPress={() => {
            setEditingProduct(product);      // Truyền sản phẩm hiện tại vào modal
            setEditModalVisible(true);       // Hiện modal sửa
        }}>
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Chỉnh sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: "#DC2626" }]} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Xóa</Text>
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Nhập số lượng tồn kho</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nhập số lượng"
              keyboardType="numeric"
              value={newQuantity}
              onChangeText={setNewQuantity}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalBtn, { backgroundColor: "#ccc" }]}>
                <Text>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmQuantity} style={[styles.modalBtn, { backgroundColor: "#22c55e" }]}>
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <EditProductModal
        visible={editModalVisible}
        product={editingProduct}
        onClose={() => setEditModalVisible(false)}
        onSuccess={async () => {
          if (productId) {
            const updated = await getDocumentById("products", productId);
            setProduct(updated);
          }
        }}
      />



    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#B91C1C",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backBtn: {
    marginRight: 10,
  },
  headerTitle: { color: "#fff", fontWeight: "bold", fontSize: 20 },

  badge: {
    backgroundColor: "#FEE2E2",
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  name: { fontSize: 24, fontWeight: "bold", color: "#111" },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 6,
    color: "#B91C1C",
  },
  text: { color: "#444", lineHeight: 20, marginLeft: 2 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    backgroundColor: "transparent",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 20,
    width: "45%",
  },
  btnText: { color: "#fff", fontWeight: "600", marginLeft: 6 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },  
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  label: {
    fontSize: 15,
    color: "#444",
  },
  price: {
    color: "#228B22",
    fontWeight: "bold",
    fontSize: 16,
  },
  stock: {
    fontWeight: "bold",
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  Date:{
    flexDirection: "row",
    justifyContent: "space-between",
  },
  category:{
    fontSize: 15,
    color: "black",
    fontWeight:"bold"
  }
});
