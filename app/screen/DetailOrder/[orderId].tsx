import { Order } from "@/app/types/order";
import { addDocument, getDocumentById, updateDocument } from "@/services/firestoreService";
import { getStatusColor, getStatusOrderFromName } from "@/utils/helpers";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function OrderDetailScreen(){
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [isAvailable, setIsAvailable] = useState(true);
    const [loading, setLoading] = useState(true);
    const insets = useSafeAreaInsets();
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);

    useEffect(() => {
        const fetchOrderDetail = async () => {
          if (!orderId) return;
          setLoading(true);
      
          try {
            const data = await getDocumentById("orders", orderId);
      
            if (data) {
              // Lấy thêm thông tin sản phẩm
              const itemsWithDetails = await Promise.all(
                data.items.map(async (it: any) => {
                  const product = await getDocumentById("products", it.productId);
                  return {
                    ...it,
                    name: product?.name || "Không rõ tên",
                    price: product?.price || 0,
                  };
                })
              );
      
              setOrder({ ...data, items: itemsWithDetails });
            }
          } catch (err) {
            console.error("Lỗi tải chi tiết đơn:", err);
          } finally {
            setLoading(false);
          }
        };
      
        fetchOrderDetail();
      }, [orderId]);
      
      
      const handleUpdateStatus = async (order: Order, newStatus: string) => {
        try {
          // 1️⃣ Cập nhật trạng thái đơn hàng
          await updateDocument("orders", order.id, { status: newStatus });
          setOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
          // 2️⃣ Xác định nội dung thông báo
          let title = "";
          let body = "";
      
          switch (newStatus) {
            case "confirmed":
              title = "Đơn hàng đã được xác nhận";
              body = `Đơn hàng #${order.id} của bạn đã được xác nhận và sẽ sớm được chuẩn bị để giao.`;
              break;
            case "delivering":
              title = "Đơn hàng đang được giao";
              body = `Đơn hàng #${order.id} đang trên đường đến địa chỉ ${order.address}.`;
              break;
            case "completed":
              title = "Đơn hàng đã hoàn thành";
              body = `Cảm ơn bạn! Đơn hàng #${order.id} đã được giao thành công.`;
              break;
            case "cancelled":
              title = "Đơn hàng đã bị hủy";
              body = `Rất tiếc! Đơn hàng #${order.id} của bạn đã bị hủy. Vui lòng liên hệ cửa hàng nếu cần hỗ trợ.`;
              break;
            case "pending":
              title = "Đơn hàng đang chờ xác nhận";
              body = `Đơn hàng #${order.id} đã được gửi đi và đang chờ cửa hàng xác nhận.`;
              break;
            default:
              title = "Cập nhật đơn hàng";
              body = `Đơn hàng #${order.id} đã thay đổi trạng thái: ${getStatusOrderFromName(newStatus)}.`;
              break;
          }
      
          // 3️⃣ Gửi notify vào subcollection users/{userId}/notify
          if (order.userId) {
            const notifyData = {
              title,
              body,
              createdAt: new Date().toISOString(),
              orderId: order.id,
              read: false,
            };
      
            await addDocument(`users/${order.userId}/notify`, notifyData);
          }
      
          // 4️⃣ Hiển thị thông báo cho admin
          Toast.show({
            type: "success",
            text1: `Đã cập nhật: ${getStatusOrderFromName(newStatus)}`,
          });
      
        } catch (err) {
          console.error("Lỗi cập nhật trạng thái:", err);
          Toast.show({
            type: "error",
            text1: "Cập nhật trạng thái thất bại",
          });
        }
      };
      
    const renderActionButtons = (order: Order) => {
        switch (order.status) {
          case "pending":
            return (
              <>
                <TouchableOpacity
                  style={[styles.btn, styles.btnCancel]}
                  onPress={() => handleUpdateStatus(order, "cancelled")}
                >
                  <Text style={styles.btnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnConfirm]}
                  onPress={() => handleUpdateStatus(order, "confirmed")}
                >
                  <Text style={styles.btnText}>Xác nhận</Text>
                </TouchableOpacity>
              </>
            );
      
          case "confirmed":
            return (
              <>
                <TouchableOpacity
                    style={[styles.btn, styles.btnCancel]}
                    onPress={() => handleUpdateStatus(order, "cancelled")}
                  >
                    <Text style={styles.btnText}>Hủy</Text>
                  </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnDeliver]}
                  onPress={() => handleUpdateStatus(order, "delivering")}
                >
                  <Text style={styles.btnText}>Giao hàng</Text>
                </TouchableOpacity>
              </>
            );
      
          case "delivering":
            return (
              <>
                <TouchableOpacity
                    style={[styles.btn, styles.btnCancel]}
                    onPress={() => handleUpdateStatus(order, "cancelled")}
                  >
                    <Text style={styles.btnText}>Hủy</Text>
                  </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnComplete]}
                  onPress={() => handleUpdateStatus(order, "completed")}
                >
                  <Text style={styles.btnText}>Hoàn thành</Text>
                </TouchableOpacity>
              </>
            );
      
          default:
            return null; // trạng thái cancelled hoặc completed thì không có nút
        }
      };

    if (loading) {
        return (
            <View style={[styles.center, { paddingTop: insets.top }]}>
            <ActivityIndicator size="large" color="#B91C1C" />
            </View>
        );
    }

    if (!order) {
        return (
            <View style={[styles.center, { paddingTop: insets.top }]}>
            <Text>Không tìm thấy sản phẩm</Text>
            </View>
        );
    }  

    return(
        <View style={{ flex: 1, backgroundColor: "#eee" }}>
            {/* Status bar */}
            <StatusBar backgroundColor="#B91C1C" barStyle="light-content" translucent={false}/>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10}]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={25} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
            </View>
            
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}  contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Thông tin khách hàng */}
                <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="person-circle-outline" size={20} color="#B91C1C" />
                    <Text style={styles.cardTitle}>Thông tin khách hàng</Text>
                </View>
                <Text style={styles.infoText}>
                    <Text style={styles.infoLabel}>Tên khách hàng: </Text>
                    {order.fullName}
                </Text>
                <Text style={styles.infoText}>
                    <Text style={styles.infoLabel}>Số điện thoại: </Text>
                    {order.phoneNumber}
                </Text>
                <Text style={styles.infoText}>
                    <Text style={styles.infoLabel}>Địa chỉ: </Text>
                    {order.address}
                </Text>
                </View>

                {/* Sản phẩm */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="cart-outline" size={20} color="#B91C1C" />
                        <Text style={styles.cardTitle}>Sản phẩm đã đặt</Text>
                    </View>
                    {order.items.map((item, i) => (
                        <View key={i} style={styles.itemRow}>
                            <Text style={{ flex: 1 }}>{item.name} x{item.quantity}</Text>
                            <Text style={{ color: "#b91c1c" }}>
                                {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Ghi chú */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="document-text-outline" size={20} color="#B91C1C" />
                        <Text style={styles.cardTitle}>Ghi chú</Text>
                    </View>
                    <Text style={{ color: "#444" }}>
                        {order.notify ? order.notify : "Không có ghi chú"}
                    </Text>
                </View>

                {/* Thanh toán */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="cash-outline" size={20} color="#B91C1C" />
                        <Text style={styles.cardTitle}>Thanh toán</Text>
                    </View>
                    <Text>Phương thức: Tiền mặt</Text>
                    <Text style={styles.totalText}>
                        Tổng tiền:{" "}
                        <Text style={{ color: "#B91C1C", fontWeight: "700" }}>
                        {order.totalPrice.toLocaleString("vi-VN")}đ
                        </Text>
                    </Text>
                </View>

                {/* Trạng thái */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="information-circle-outline" size={20} color="#B91C1C" />
                        <Text style={styles.cardTitle}>Trạng thái</Text>
                    </View>
                    <View style={[styles.statusBox, { backgroundColor: getStatusColor(order.status) + "22" }]}>
                        <Text
                            style={[styles.statusText, { color: getStatusColor(order.status) }]}
                        >
                        {getStatusOrderFromName(order.status)}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                {renderActionButtons(order)}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
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
    content: { padding: 12 },
    card: {
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    cardTitle: {
        fontWeight: "700",
        color: "#B91C1C",
        marginLeft: 6,
        fontSize: 15,
    },
    infoText: { color: "#333", marginBottom: 4 },
    infoLabel: { fontWeight: "600" },
    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginVertical: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: "#eee",
        paddingBottom: 4,
      },
      totalText: {
        marginTop: 8,
        fontSize: 15,
        fontWeight: "600",
      },
    statusBox: {
        backgroundColor: "#e0f2fe",
        borderRadius: 8,
        paddingVertical: 6,
        alignItems: "center",
        marginTop: 6,
      },
      statusText: {
        color: "#2563eb",
        fontWeight: "700",
      },
      footer: {
        position: "absolute",
        bottom: 20,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-around",
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
    btnCancel: { backgroundColor: "#ef4444" }, // đỏ
    btnConfirm: { backgroundColor: "#3b82f6" }, // xanh dương
    btnDeliver: { backgroundColor: "#f59e0b" }, // vàng
    btnComplete: { backgroundColor: "#10b981" }, // xanh lá
})