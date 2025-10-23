// app/drawer/order.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { addDocument, deleteDocument, getAllDocuments, getDocumentById, getDocumentsWithPagination, updateDocument } from "../../services/firestoreService";
import { Order, OrderItem } from "../types/order";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getStatusColor, getStatusOrderFromName } from "@/utils/helpers";
import Toast from "react-native-toast-message";
import OrderActionModal from "../components/order/OrderActionModal";
import EditOrderModal from "../components/order/EditOrderModal";


export default function OrderScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const router = useRouter();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const animatedHeight = useRef(new Animated.Value(0)).current;
  const OPTION_HEIGHT = 40;
  const MAX_VISIBLE_OPTIONS = 3;
  
  const STATUS_ORDER = ["all", "pending", "confirmed", "delivering", "completed", "cancelled"];
  const [status] = useState<string[]>(STATUS_ORDER);

  // --- Gọi API load đơn hàng ---
  const loadOrders = async (sta: string, searchText: string) => {
    try {
      setLoading(true);
  
      // Gọi trang đầu
      const res = await getDocumentsWithPagination("orders", 10);
      let allDocs = res.documents;
  
      // Nếu ít hơn 10 mà vẫn còn trang tiếp, load thêm
      if (res.documents.length < 10 && res.nextPageToken) {
        const res2 = await getDocumentsWithPagination("orders", 10, res.nextPageToken);
        allDocs = [...res.documents, ...res2.documents];
        setPageToken(res2.nextPageToken || null);
      } else {
        setPageToken(res.nextPageToken || null);
      }
      
      //  Đảm bảo items luôn là mảng
      allDocs = allDocs.map((o: Order) => {
        let itemsArray: OrderItem[] = [];
      
        if (Array.isArray(o.items)) {
          itemsArray = o.items;
        } else if (o.items && typeof o.items === "object") {
          // nếu items là object có key 0,1,2,...
          itemsArray = Object.values(o.items);
        }
      
        return {
          ...o,
          items: itemsArray,
        };
      });

      //  Join dữ liệu sản phẩm để có name, price, image
      for (const order of allDocs) {
        const detailedItems = await Promise.all(
          order.items.map(async (i: any) => {
            const product = await getDocumentById("products", i.productId);
            return {
              ...i,
              name: product?.name || "Sản phẩm đã xóa",
              price: product?.price || 0,
              image: product?.image || null,
            };
          })
        );
        order.items = detailedItems;
      }

      // Lọc theo trạng thái
      if (sta !== "all") {
        allDocs = allDocs.filter((o: Order) => 
          o.status === sta
        );
      }
  
      // Lọc theo từ khóa tìm kiếm
      if (searchText.trim() !== "") {
        allDocs = allDocs.filter((o: Order) =>
          o.phoneNumber.toLowerCase().includes(searchText.toLowerCase())
        );
      }
  
      setOrders(allDocs);
    } catch (err) {
      console.error("Lỗi lấy đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };
     
   // --- Load thêm khi cuộn xuống ---
   const loadMoreOrders = async () => {
    if (!pageToken || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getDocumentsWithPagination("orders", 10, pageToken);
      let data = res.documents;

      if (activeCat !== "all") {
        data = data.filter((o:Order) => o.status === activeCat);
      }

      if (search.trim() !== "") {
        data = data.filter((o:Order) =>
          o.phoneNumber.toLowerCase().includes(search.toLowerCase())
        );
      }

      setOrders((prev) => [...prev, ...data]);
      setPageToken(res.nextPageToken || null);
    } catch (err) {
      console.error("Lỗi load thêm đơn hàng:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Khi màn hình focus hoặc đổi category/search
  useFocusEffect(
    useCallback(() => {
      loadOrders(activeCat, search);
    }, [activeCat, search])
  );

  // Dropdown animation
  useEffect(() => {
    const visibleCount = Math.min(status.length, MAX_VISIBLE_OPTIONS);
    Animated.timing(animatedHeight, {
      toValue: dropdownOpen ? visibleCount * OPTION_HEIGHT : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [dropdownOpen, status]);

  const handleUpdateStatus = async (order: Order, newStatus: string) => {
    try {
      // 1️⃣ Cập nhật trạng thái đơn hàng
      await updateDocument("orders", order.id, { status: newStatus });
  
      // 2️⃣ Xác định nội dung thông báo
      let title = "";
      let body = "";
  
      switch (newStatus) {
        case "confirmed":
          title = "Đơn hàng đã được xác nhận";
          body = `Đơn hàng #${order.id.slice(-4)} của bạn đã được xác nhận và sẽ sớm được chuẩn bị để giao.`;
          break;
        case "delivering":
          title = "Đơn hàng đang được giao";
          body = `Đơn hàng #${order.id.slice(-4)} đang trên đường đến địa chỉ ${order.address}.`;
          break;
        case "completed":
          title = "Đơn hàng đã hoàn thành";
          body = `Cảm ơn bạn! Đơn hàng #${order.id.slice(-4)} đã được giao thành công.`;
          break;
        case "cancelled":
          title = "Đơn hàng đã bị hủy";
          body = `Rất tiếc! Đơn hàng #${order.id.slice(-4)} của bạn đã bị hủy. Vui lòng liên hệ cửa hàng nếu cần hỗ trợ.`;
          break;
        default:
          title = "Cập nhật đơn hàng";
          body = `Đơn hàng #${order.id.slice(-4)} đã thay đổi trạng thái: ${getStatusOrderFromName(newStatus)}.`;
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
  
      // 5️⃣ Render lại danh sách
      loadOrders(activeCat, search);
  
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
      Toast.show({
        type: "error",
        text1: "Cập nhật trạng thái thất bại",
      });
    }
  };

  const openActions = (order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const closeActions = () => {
    setSelectedOrder(null);
    setModalVisible(false);
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
  
  
  const renderOrder = ({item} : {item : Order}) => (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.code}>#{item.id}</Text>
        <View
          style={[
            styles.statusTag,
            { backgroundColor: getStatusColor(item.status) + "22" },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {getStatusOrderFromName(item.status)}
          </Text>
        </View>
      </View>

      {/* Customer info */}
      <View style={styles.customerBox}>
        <Text style={styles.customerName}>{item.fullName}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={17} color="#333" />
          <Text style={styles.customerPhone}>{item.phoneNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={17} color="#333" />
          <Text style={styles.customerAddress}>{item.address}</Text>
        </View>
      </View>

      {/* Items */}
      <View style={styles.itemBox}>
        {(() => {
          const maxVisible = 3; // số món hiển thị tối đa
          const visibleItems = item.items?.slice(0, maxVisible) || [];

          return (
            <>
              {visibleItems.map((food: any, idx: number) => (
                <Text key={idx} style={styles.itemText}>
                  {food.name} x{food.quantity}
                </Text>
              ))}
              {item.items && item.items.length > maxVisible && (
                <Text style={styles.itemText}>...</Text>
              )}
            </>
          );
        })()}
      </View>


      {/* Footer */}
      <View style={styles.footerRow}>
        <Text style={styles.price}>
          {item.totalPrice?.toLocaleString("vi-VN")} đ
        </Text>
        <View style={{flexDirection:"row"}}>
          <Ionicons name="time-outline" size={17} color="#333" />
          <Text style={styles.time}>
            {item.createdAt
              ? new Date(item.createdAt).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                })
              : "--:--"}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow1}>
        <View>
          <TouchableOpacity
            style={[styles.btnDetail]}
            onPress={() => openActions(item)}
          >
            <Text style={styles.btnText}>Xem chi tiết</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionRow2}>
          {renderActionButtons(item)}
        </View>
      </View>
    </View>
  )


  return (
    <View style={styles.container}>
      <View style={styles.managerBox}>
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={18}
            color="#666"
            style={{ marginRight: 6 }}
          />
          <TextInput
            placeholder="Tìm kiếm theo số điện thoại..."
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1 }}
          />
        </View>

        {/* Select Box */}
        <View style={{ position: "relative" }}>
          <TouchableOpacity
            style={[
              styles.selectBox,
              dropdownOpen && {
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              },
            ]}
            onPress={() => setDropdownOpen(!dropdownOpen)}
          >
            <Text style={styles.selectedText}>
              {getStatusOrderFromName(activeCat)}
            </Text>
            <Ionicons
              name={dropdownOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color="#333"
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Dropdown */}
      <Animated.View
        style={[
          styles.dropdownWrapper,
          {
            maxHeight: animatedHeight,
            borderBottomWidth: dropdownOpen ? 1 : 0,
          },
        ]}
      >
        <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator={false}>
          {status.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.option}
              onPress={() => {
                setActiveCat(item);
                setDropdownOpen(false);
              }}
            >
              <Text style={styles.optionText}>{getStatusOrderFromName(item)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {dropdownOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setDropdownOpen(false)}
        />
      )}


      {/* Danh sách sản phẩm */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="blue" />
          <Text style={{ marginTop: 10, color: "#666" }}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          style={{ marginTop: 10 }}
          onEndReached={loadMoreOrders} // gọi khi cuộn gần cuối
          onEndReachedThreshold={0.05} // 5% cuối danh sách
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 12 }} size="small" color="gray" />
            ) : null
          }
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20, color: "#666" }}>
              Không có đơn hàng
            </Text>
          }
        />
      )}

      <OrderActionModal
        visible={modalVisible}
        order={selectedOrder}
        onClose={closeActions}
        onDeleted={(id) => {
          setOrders((prev) => prev.filter((p) => p.id !== id)); // xoá ngay khỏi danh sách
        }}
        onEdit={(product) => {
          setEditingOrder(product);
          setEditModalVisible(true);
        }}
      />
      <EditOrderModal
        visible={editModalVisible}
        order={editingOrder}
        onClose={() => setEditModalVisible(false)}
        onSuccess={() => loadOrders(activeCat, search)}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eee", padding: 12 },
  managerBox: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "gray",
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3.5,
    elevation: 7,
    zIndex: 1000,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  selectBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  selectedText: { fontSize: 14, color: "#333" },
  dropdownWrapper: {
    position: "absolute",
    top: 131,
    left: 0.6,
    right: 0,
    marginHorizontal: 24,
    zIndex: 2000,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  option: {
    paddingHorizontal: 12,
    justifyContent: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  optionText: { fontSize: 14, color: "#333" },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 1000,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  code: { fontWeight: "600", fontSize: 15, color: "#111" },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 13, fontWeight: "500" },
  customerBox: { marginBottom: 6 },
  customerName: { fontSize: 15, fontWeight: "500", color: "#222" },
  infoRow:{ flexDirection:"row", paddingTop: 5},
  customerPhone: { fontSize: 13, color: "#555", paddingLeft: 5 },
  customerAddress: { fontSize: 13, color: "#555", paddingLeft: 5 },
  itemBox: { flexDirection: "row", flexWrap: "wrap", marginBottom: 6 },
  itemText: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
    fontSize: 13,
    fontWeight:"500"
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: { fontWeight: "600", color: "#d62828", fontSize: 15 },
  time: { color: "#555", fontSize: 13, paddingLeft: 5},
  actionRow1: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionRow2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionBtn: { marginLeft: 6 },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginLeft: 8,
  },
  btnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  btnCancel: { backgroundColor: "#ef4444" }, // đỏ
  btnConfirm: { backgroundColor: "#3b82f6" }, // xanh dương
  btnDeliver: { backgroundColor: "#f59e0b" }, // vàng
  btnComplete: { backgroundColor: "#10b981" }, // xanh lá
  btnDetail: { 
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: "gray",
  }
});
