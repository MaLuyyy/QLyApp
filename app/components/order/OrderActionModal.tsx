import { Order } from "@/app/types/order";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { deleteDocument } from "@/services/firestoreService";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";

interface Props {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onDeleted?: (id: string) => void;
  onEdit?: (order: Order) => void;
}

export default function OrderActionModal({
  visible,
  order,
  onClose,
  onDeleted,
  onEdit
}: Props) {

  const router = useRouter();

  const handleView = () => {
    if (!order) return;
    router.push(`/screen/DetailOrder/${order.id}`);
    onClose();
  };

  const handleEdit = () => {
    if (!order) return;
    onClose();
    onEdit?.(order);
  };

  const handleDelete = () => {
    if (!order?.id) return;
    Alert.alert(
      "Xác nhận",
      `Bạn có chắc muốn xóa đơn hàng không?`,
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", style: "destructive",
          onPress: async() => {
            try{
              await deleteDocument("orders", order?.id);
              Toast.show({
                type: "success",
                text1: "Xóa món ăn thành công",
                position: "top"
              })
              onClose();
              onDeleted?.(order?.id);
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

  
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />

      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Đơn hàng #{order?.id ? order.id.slice(-5) : ""}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.modalAction, pressed && { backgroundColor: "#f3f4f6" }]}
          onPress={handleView}
        >
          <Ionicons name="eye-outline" size={20} color="#333" style={{ marginRight: 8 }} />
          <Text style={styles.modalText}>Thông tin đơn hàng</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.modalAction, pressed && { backgroundColor: "#f3f4f6" }]}
          onPress={handleEdit}
        >
          <Ionicons name="pencil-outline" size={20} color="#333" style={{ marginRight: 8 }} />
          <Text style={styles.modalText}>Chỉnh sửa</Text>
        </Pressable>

        <Pressable 
          style={[styles.modalAction, { backgroundColor: "#fee2e2" }]} 
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color="red" style={{ marginRight: 8 }} />
          <Text style={{ color: "red", fontWeight: "500" }}>Xóa món ăn</Text>
        </Pressable>

        <Pressable 
          style={styles.cancelBtn} 
          onPress={onClose}
        >
          <Text style={{ fontWeight: "600" }}>Hủy</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  modalAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 12,
    marginVertical: 5,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  modalText: {
    fontSize: 14,
    fontWeight: "500",
  },
  cancelBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
});
