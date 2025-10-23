import { deleteDocument, getDocumentsWithPagination } from "@/services/firestoreService";
import { getRoleColor, getRoleStaffFromName } from "@/utils/helpers";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import AddStaffModal from "../components/staff/AddStaffModal";
import EditStaffModal from "../components/staff/EditStaffModal";
import { Staff } from "../types/staff";
import DetailStaffModal from "../components/staff/DetailStaffModal";

export default function StaffScreen() {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeRole, setActiveRole] = useState("all");
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const animatedHeight = useRef(new Animated.Value(0)).current;
  const OPTION_HEIGHT = 40;
  const MAX_VISIBLE_OPTIONS = 5;

  const roles = ["all", "chef", "accountant", "shipper", "cleaner"];

  // --- Load danh sách nhân viên ---
  const loadStaffs = async (role: string, searchText: string) => {
    try {
      setLoading(true);
      const res = await getDocumentsWithPagination("staffs", 10);
      let allDocs = res.documents;

      if (res.documents.length < 10 && res.nextPageToken) {
        const res2 = await getDocumentsWithPagination(
          "staffs",
          10,
          res.nextPageToken
        );
        allDocs = [...res.documents, ...res2.documents];
        setPageToken(res2.nextPageToken || null);
      } else {
        setPageToken(res.nextPageToken || null);
      }

      // Lọc theo vai trò
      if (role !== "all") {
        allDocs = allDocs.filter((s: Staff) => s.role === role);
      }

      // Lọc theo tên
      if (searchText.trim() !== "") {
        allDocs = allDocs.filter((s: Staff) =>
          s.name.toLowerCase().includes(searchText.toLowerCase())
        );
      }

      setStaffs(allDocs);
    } catch (err) {
      console.error("Lỗi lấy nhân viên:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Load thêm nhân viên ---
  const loadMoreStaffs = async () => {
    if (!pageToken || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getDocumentsWithPagination("staffs", 10, pageToken);
      let data = res.documents;

      if (activeRole !== "all") {
        data = data.filter((s: Staff) => s.role === activeRole);
      }

      if (search.trim() !== "") {
        data = data.filter((s: Staff) =>
          s.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      setStaffs((prev) => [...prev, ...data]);
      setPageToken(res.nextPageToken || null);
    } catch (err) {
      console.error("Lỗi load thêm nhân viên:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // --- Gọi load khi focus ---
  useFocusEffect(
    useCallback(() => {
      loadStaffs(activeRole, search);
    }, [activeRole, search])
  );

  // --- Animation dropdown ---
  useEffect(() => {
    const visibleCount = Math.min(roles.length, MAX_VISIBLE_OPTIONS);
    Animated.timing(animatedHeight, {
      toValue: dropdownOpen ? visibleCount * OPTION_HEIGHT : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [dropdownOpen, roles]);

  const handleDelete = (id: string) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc muốn xóa nhân viên này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteDocument("staffs", id); // gọi service xóa Firestore
              setStaffs((prev) => prev.filter((s) => s.id !== id));
              Toast.show({
                type: "success",
                text1: "Xóa nhân viên thành công",
                position: "top",
              })
            } catch (err) {
              console.error("Lỗi xóa nhân viên:", err);
              Alert.alert("Lỗi", "Không thể xóa nhân viên, vui lòng thử lại");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  
  // --- Render từng nhân viên ---
  const renderStaff = ({ item }: { item: Staff }) => {
    const roleStyle = getRoleColor(item.role);

    return (
      <View style={styles.card}>
        {/* Hàng tên + vai trò + trạng thái */}
        <View style={styles.rowBetween}>
          <Text style={styles.name}>{item.name}</Text>

          <View
            style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}
          >
            <Text style={[styles.roleText, { color: roleStyle.color }]}>
              {getRoleStaffFromName(item.role)}
            </Text>
          </View>
        </View>

        {/* Thông tin liên hệ */}
        <View style={styles.subTextRow}>
            <Ionicons name="call-outline" size={14} color="#666" style={{ marginRight: 6 }} />
            <Text style={styles.subText}>{item.phone}</Text>
        </View>
        
        <View style={styles.subTextRow}>
            <Ionicons name="mail-outline" size={14} color="#666" style={{ marginRight: 6 }} />
            <Text style={styles.subText}>{item.email}</Text>
        </View>

        <View style={styles.subTextRow}>
            <Ionicons name="location-outline" size={14} color="#666" style={{ marginRight: 6 }} />
            <Text style={styles.subText}>{item.address}</Text>
        </View>


        {/* Hành động */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => {
              setSelectedStaff(item);
              setDetailModalVisible(true);
            }}
          >
            <Ionicons name="eye-outline" size={16} color="#111" />
            <Text style={styles.actionText}>Chi tiết</Text>
          </TouchableOpacity>
          <View style={styles.actionRow2}>
            <TouchableOpacity style={styles.actionBtn} 
            onPress={() => {
                setEditingStaff(item);
                setEditModalVisible(true);
            }}>
                <Ionicons name="create-outline" size={16} color="orange" />
                <Text style={[styles.actionText, {color:"orange"}]}>Sửa</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={16} color="red" />
                <Text style={[styles.actionText, {color:"red"}]}>Xóa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header quản lý */}
      <View style={styles.managerBox}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Quản lý nhân viên</Text>
          <TouchableOpacity style={styles.addBtn}  onPress={() => setAddModalVisible(true)}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addText}>Thêm</Text>
          </TouchableOpacity>
        </View>

        {/* Tìm kiếm */}
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={18}
            color="#666"
            style={{ marginRight: 6 }}
          />
          <TextInput
            placeholder="Tìm kiếm theo tên"
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1 }}
          />
        </View>

        {/* Dropdown chọn vai trò */}
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
              {getRoleStaffFromName(activeRole)}
            </Text>
            <Ionicons
              name={dropdownOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color="#333"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Danh sách role options */}
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
          {roles.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.option}
              onPress={() => {
                setActiveRole(item);
                setDropdownOpen(false);
              }}
            >
              <Text style={styles.optionText}>
                {getRoleStaffFromName(item)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Overlay đóng dropdown */}
      {dropdownOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setDropdownOpen(false)}
        />
      )}

      {/* Danh sách nhân viên */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="blue" />
          <Text style={{ marginTop: 10, color: "#666" }}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <FlatList
          data={staffs}
          keyExtractor={(item) => item.id}
          renderItem={renderStaff}
          style={{ marginTop: 10 }}
          onEndReached={loadMoreStaffs} // gọi khi cuộn gần cuối
          onEndReachedThreshold={0.05} // 5% cuối danh sách
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 12 }} size="small" color="gray" />
            ) : null
          }
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20, color: "#666" }}>
              Không có sản phẩm
            </Text>
          }
        />
      )}

        <AddStaffModal
            visible={addModalVisible}
            onClose={() => setAddModalVisible(false)}
            onSuccess={() => loadStaffs(activeRole, search)}
        />
        <EditStaffModal
        visible={editModalVisible}
        staff={editingStaff}
        onClose={() => setEditModalVisible(false)}
        onSuccess={() => loadStaffs(activeRole, search)}
        />
        <DetailStaffModal
        visible={detailModalVisible}
        staff={selectedStaff}
        onClose={() => setDetailModalVisible(false)}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9", padding: 12 },

  managerBox: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: { fontSize: 16, fontWeight: "700", color: "#111827" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#90EE90",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addText: { color: "#fff", fontWeight: "600", marginLeft: 4 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 12,
    marginBottom: 10,
  },

  // === Card nhân viên ===
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    flexWrap: "wrap",
  },
  name: { fontSize: 15, fontWeight: "700", color: "#111827", flex: 1 },
  roleBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginHorizontal: 4,
  },
  roleText: { fontSize: 12, fontWeight: "600" },
  subText: { fontSize: 13, color: "#374151", marginBottom: 2 },
  subTextRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  money: { color: "#16a34a", fontWeight: "700" },
  infoText: { marginLeft: 4, color: "#111827", fontSize: 13 },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    marginTop: 14,
  },
  actionRow2: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 5},
  actionText: { marginLeft: 4, fontSize: 15, color: "#111827" },

  // === Dropdown ===
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
    top: 184,
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
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center" },
});
