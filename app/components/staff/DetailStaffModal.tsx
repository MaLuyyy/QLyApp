import React from "react";
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { Staff } from "@/app/types/staff";
import { Ionicons } from "@expo/vector-icons";
import { getGenderColor, getRoleColor, getRoleStaffFromName } from "@/utils/helpers";

interface Props {
  visible: boolean;
  onClose: () => void;
  staff: Staff | null;
}

export default function StaffDetailModal({ visible, onClose, staff }: Props) {

  if (!staff) return null;
  const roleStyle = getRoleColor(staff.role);
  const genderStyle = getGenderColor(staff.gender);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header: ảnh + tên + mã */}
            <View style={styles.headerRow}>
              {staff.image ? (
                <Image source={{ uri: staff.image }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person-outline" size={36} color="#999" />
                </View>
              )}
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.name}>{staff.name}</Text>
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, { backgroundColor: roleStyle.bg }]}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: roleStyle.color }}>{getRoleStaffFromName(staff.role)}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: genderStyle.bg}]}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: genderStyle.color }}>{staff.gender}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Thông tin liên hệ */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={16} color="#666" style={{ width: 20 }} />
                <Text style={styles.infoText}>{staff.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={16} color="#666" style={{ width: 20 }} />
                <Text style={styles.infoText}>{staff.email}</Text>
              </View>
            </View>

            {/* Ngày sinh */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ngày sinh</Text>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#666" style={{ width: 20 }} />
                <Text style={styles.infoText}>{staff.birthDate}</Text>
              </View>
            </View>

            {/* Địa chỉ */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Địa chỉ</Text>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#666" style={{ width: 20 }} />
                <Text style={styles.infoText}>{staff.address}</Text>
              </View>
            </View>

            {/* Lương */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lương tháng</Text>
              <View style={styles.infoRow}>
                <Ionicons name="logo-usd" size={16} color="#666" style={{ width: 20 }} />
                <Text style={styles.infoText}>{staff.salary.toLocaleString()} đ</Text>
              </View>
            </View>

            {/* Ngày tạo & cập nhật */}
            <View style={[styles.section, { flexDirection: "row", justifyContent: "space-between" }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Ngày tạo</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={16} color="#666" style={{ width: 20 }} />
                  <Text style={styles.infoText}>{new Date(staff.createAt).toLocaleDateString()}</Text>
                </View>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.sectionTitle}>Cập nhật</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color="#666" style={{ width: 20 }} />
                  <Text style={styles.infoText}>{new Date(staff.updateAt).toLocaleDateString()}</Text>
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
  staffCode: { fontSize: 14, color: "#666", marginTop: 2 },
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
