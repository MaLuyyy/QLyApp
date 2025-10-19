import { useLocalSearchParams, useRouter } from "expo-router";
import { deleteDocument, getDocumentById } from "@/services/firestoreService";
import { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Product } from "@/app/types/product";
import { getCategoryFromName } from "@/utils/helpers";
import Toast from "react-native-toast-message";

export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      getDocumentById("products", productId)
        .then((data) => setProduct(data))
        .finally(() => setLoading(false));
    }
  }, [productId]);

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
        <Image source={{ uri: product.image }} style={styles.image} />
        <View style={{ padding: 16 }}>
        <View style={styles.card}>
          <Text style={styles.name}>{product.name}</Text>

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
            <Text style={styles.text}>
              Ngày tạo:{" "}
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
            <Text style={styles.text}>
              Cập nhật lần cuối:{" "}
              {product.updateAt
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
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: "#F97316" }]}>
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Chỉnh sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: "#DC2626" }]}>
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Xóa</Text>
        </TouchableOpacity>
      </View>
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
  image: { width: "100%", height: "100%" },
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
    backgroundColor: "#fff",
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
  
});
