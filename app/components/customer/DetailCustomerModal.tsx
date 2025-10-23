import React, { useEffect, useState } from "react";
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getGenderColor} from "@/utils/helpers";
import { Customer } from "@/app/types/customer";
import { countOrdersByUserId } from "@/services/firestoreService";

interface Props {
  visible: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export default function CustomerDetailModal({ visible, onClose, customer }: Props) {
    const [orderCount, setOrderCount] = useState<number | null>(null);
    useEffect(() => {
        if (!customer) return;
        setOrderCount(null); // reset khi đổi khách hàng
    
        const fetchOrderCount = async () => {
          try {
            const count = await countOrdersByUserId(customer.id);
            setOrderCount(count);
          } catch (err) {
            console.error("Lỗi lấy số đơn hàng:", err);
            setOrderCount(0);
          }
        };
    
        fetchOrderCount();
      }, [customer]);
      
  if (!customer) return null;
  const genderStyle = getGenderColor(customer.gender);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header: ảnh + tên + mã */}
            <View style={styles.headerRow}>
              {customer.image ? (
                <Image source={{ uri: customer.image }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person-outline" size={36} color="#999" />
                </View>
              )}
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.name}>{customer.name}</Text>
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, { backgroundColor: genderStyle.bg}]}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: genderStyle.color }}>{customer.gender}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Thông tin liên hệ */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={16} color="#666" style={{ width: 20 }} />
                <Text style={styles.infoText}>{customer.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={16} color="#666" style={{ width: 20 }} />
                <Text style={styles.infoText}>{customer.email}</Text>
              </View>
            </View>

            {/* Ngày sinh */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ngày sinh</Text>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#666" style={{ width: 20 }} />
                <Text style={styles.infoText}>{customer.birthDate}</Text>
              </View>
            </View>

            {/* Số đơn hàng */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Đơn hàng đã hoàn tất</Text>
              <View style={styles.infoRow}>
                <Ionicons name="cart-outline" size={16} color="#666" style={{ width: 20 }} />
                {orderCount === null ? (
                  <ActivityIndicator size="small" color="#f97316" />
                ) : (
                  <Text style={[styles.infoText, { fontWeight: "600" }]}>{orderCount}</Text>
                )}
              </View>
            </View>


            {/* Ngày tạo & cập nhật */}
            <View style={[styles.section, { flexDirection: "row", justifyContent: "space-between" }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Ngày tạo</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={16} color="#666" style={{ width: 20 }} />
                  <Text style={styles.infoText}>{new Date(customer.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.sectionTitle}>Cập nhật</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color="#666" style={{ width: 20 }} />
                  <Text style={styles.infoText}>{new Date(customer.updatedAt).toLocaleDateString()}</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Nút đóng */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    maxHeight: "90%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  name: { fontSize: 18, fontWeight: "700" },
  badgesRow: { flexDirection: "row", marginTop: 6 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 13, color: "#999", marginBottom: 4 },
  infoRow: { flexDirection: "row", alignItems: "center" },
  infoText: { fontSize: 14, color: "#333" },
  closeBtn: {
    marginTop: 12,
    backgroundColor: "#f97316",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeText: { color: "#fff", fontWeight: "700" },
});
