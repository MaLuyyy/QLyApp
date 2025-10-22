import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Order, OrderItem } from "@/app/types/order";
import { updateDocument } from "@/services/firestoreService";
import Toast from "react-native-toast-message";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  order: Order | null;
}

export default function EditOrderModal({ visible, onClose, onSuccess, order }: Props) {
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  const nameRegex = /^[A-Za-zÀ-ỹ\s]+$/;
  const phoneRegex = /^0[0-9]{9}$/;

  useEffect(() => {
    if (visible && order) {
      setFullName(order.fullName);
      setAddress(order.address);
      setPhoneNumber(order.phoneNumber);
      setNote(order.notify || "");
      setItems(order.items || []);
    }
  }, [visible, order]);
  

  const handleQuantityChange = (index: number, delta: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!order) return;

    const updatedItems = items.map(i => ({
      productId: i.productId,
      quantity: i.quantity,
    }));

    const payload = {
      fullName,
      address,
      phoneNumber,
      notify: note,
      items: updatedItems,
      totalPrice: total,
    };
  
    if (!fullName || !phoneNumber || !address) {
      Toast.show({
        type: 'error',
        text1: 'Vui lòng điền đầy đủ thông tin',
        position: 'top',
      });
      return;
    }
    if (!nameRegex.test(fullName.trim())) {
      Toast.show({
        type: 'error',
        text1: 'Họ tên chỉ được chứa chữ cái',
        position: 'top',
      });
      return;
    }
    if (!phoneRegex.test(phoneNumber.trim())) {
      Toast.show({
        type: 'error',
        text1: 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0',
        position: 'top',
      });
      return;
    }
    try {
      setLoading(true);
      await updateDocument("orders", order.id, payload);
      Toast.show({ type: "success", text1: "Cập nhật đơn hàng thành công" });
      onClose();
      onSuccess?.();
    } catch (err: any) {
      console.error("❌ Update order error:", err.response?.data || err.message);
      Toast.show({ type: "error", text1: "Lỗi khi lưu thay đổi" });
    } finally {
      setLoading(false);
    }
  };
  

  const renderItem = ({ item, index }: { item: OrderItem; index: number }) => (
    <View style={styles.itemRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>{item.price.toLocaleString("vi-VN")}đ</Text>
      </View>
      <View style={styles.qtyBox}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => handleQuantityChange(index, -1)}
        >
          <Ionicons name="remove-outline" size={18} color="#000" />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => handleQuantityChange(index, +1)}
        >
          <Ionicons name="add-outline" size={18} color="#000" />
        </TouchableOpacity>
      </View>
      <Text style={styles.itemTotal}>
        {(item.price * item.quantity).toLocaleString("vi-VN")}đ
      </Text>
      <TouchableOpacity onPress={() => handleRemoveItem(index)} style={styles.removeBtn}>
        <Ionicons name="close-circle-outline" size={20} color="red" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>
              Chỉnh sửa đơn hàng #{order?.id ? order.id.slice(-4) : ""}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Họ tên"
            style={styles.input}
          />
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Số điện thoại"
            keyboardType="phone-pad"
            style={styles.input}
          />

          <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Nhập địa chỉ"
            style={styles.input}
            multiline
          />

          <Text style={styles.sectionTitle}>Món ăn trong đơn</Text>
          <FlatList
            data={items}
            keyExtractor={(_, i) => i.toString()}
            renderItem={renderItem}
            scrollEnabled={true}
          />

          <Text style={styles.sectionTitle}>Ghi chú</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Nhập ghi chú"
            style={[styles.input, { height: 70 }]}
            multiline
          />

          {/* Tổng tiền */}
          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text>Tạm tính:</Text>
              <Text>{total.toLocaleString("vi-VN")}đ</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>Tổng cộng:</Text>
              <Text style={{ fontWeight: "bold", color: "#d62828", fontSize: 16 }}>
                {total.toLocaleString("vi-VN")}đ
              </Text>
            </View>
            <Text style={styles.paymentText}>Thanh toán: COD</Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={onClose}>
              <Text style={styles.btnText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnSave]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Lưu thay đổi</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#111" },
  sectionTitle: { marginTop: 10, fontWeight: "600", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#f9fafb",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 6,
  },
  itemName: { fontWeight: "500", color: "#222" },
  itemPrice: { fontSize: 12, color: "#777" },
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 4,
    marginHorizontal: 8,
  },
  qtyBtn: {
    padding: 4,
  },
  qtyText: { fontWeight: "600", width: 24, textAlign: "center" },
  itemTotal: { fontWeight: "600", color: "#222", width: 70, textAlign: "right" },
  removeBtn: {
    marginLeft: 8,
    padding: 2,
  },
  totalBox: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#f59e0b",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  paymentText: { fontSize: 13, color: "#666", marginTop: 4 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  btnCancel: { backgroundColor: "#ccc" },
  btnSave: { backgroundColor: "#f97316" },
  btnText: { color: "#fff", fontWeight: "600" },
});
