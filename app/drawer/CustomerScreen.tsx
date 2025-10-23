import { useCallback, useState, useMemo } from "react";
import { Customer } from "../types/customer";
import { getDocumentById, getDocumentsWithPagination, countOrdersByUserId } from "@/services/firestoreService";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomerDetailModal from "../components/customer/DetailCustomerModal";

export default function UserScreen() {
  const [users, setUsers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageToken, setPageToken] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);

  const openDetail = (user: Customer) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  // --- Gọi API load khách hàng ---
  const loadUsers = async (searchText: string) => {
    try {
      setLoading(true);
      const res = await getDocumentsWithPagination("users", 10);
      let allDocs = res.documents;

      // Đếm số đơn hàng theo userId
      const withOrders = await Promise.all(
        allDocs.map(async (user: Customer) => {
          const orderCount = await countOrdersByUserId(user.id);
          return { ...user, orderCount };
        })
      );
      setUsers(withOrders);

      if (res.documents.length < 10 && res.nextPageToken) {
        const res2 = await getDocumentsWithPagination(
          "users",
          10,
          res.nextPageToken
        );
        allDocs = [...res.documents, ...res2.documents];
        setPageToken(res2.nextPageToken || null);
      } else {
        setPageToken(res.nextPageToken || null);
      }

      if (searchText.trim() !== "") {
        const filtered = withOrders.filter((u: Customer) =>
          u.name.toLowerCase().includes(searchText.toLowerCase())
        );
        setUsers(filtered);
      } else {
        setUsers(withOrders);
      }

    } catch (err) {
      console.error("Lỗi lấy khách hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreUsers = async () => {
    if (!pageToken || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getDocumentsWithPagination("users", 10, pageToken);
      let data = res.documents;

      if (search.trim() !== "") {
        data = data.filter((u: Customer) =>
          u.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      setUsers((prev) => [...prev, ...data]);
      setPageToken(res.nextPageToken || null);
    } catch (err) {
      console.error("Lỗi load thêm khách hàng:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUsers(search);
    }, [search])
  );

  // --- Tính toán thống kê ---
  const stats = useMemo(() => {
    const total = users.length;
    const male = users.filter((u) => u.gender === "Nam").length;
    const female = users.filter((u) => u.gender === "Nữ").length;
    return { total, male, female };
  }, [users]);

  // --- Render từng khách hàng ---
  const renderUser = ({ item }: { item: Customer }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <Text style={styles.userName}>{item.name}</Text>
        <View
          style={[
            styles.genderTag,
            {
              backgroundColor:
                item.gender === "Nam" ? "#e0f2fe" : "#fce7f3",
            },
          ]}
        >
          <Text
            style={{
              color: item.gender === "Nam" ? "#0284c7" : "#db2777",
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            {item.gender}
          </Text>
        </View>
      </View>

      <View style={styles.userTextRow}>
        <Ionicons name="call-outline" size={14} color="#666" style={{ marginRight: 6 }} />
        <Text style={styles.userText}>{item.phone}</Text>
      </View>
      
      <View style={styles.userTextRow}>
        <Ionicons name="mail-outline" size={14} color="#666" style={{ marginRight: 6 }} />
        <Text style={styles.userText}>{item.email}</Text>
      </View>


      <View style={styles.actionRow}>
        <View style={styles.tagOrange}>
          <Ionicons name="bag-handle-outline" size={14} color="#b45309" />
          <Text style={styles.tagTextOrange}>
            {item.orderCount ?? 0} đơn hàng
          </Text>
        </View>

        <TouchableOpacity style={styles.detailBtn} onPress={() => openDetail(item)}>
          <Ionicons name="eye-outline" size={16} color="#2563eb" />
          <Text style={styles.detailText}>Chi tiết</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.managerBox}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Quản lý khách hàng</Text>
        </View>

        {/* Thống kê */}
        <View style={styles.statRow}>
          <View style={[styles.statBox, { backgroundColor: "#f5f3ff" }]}>
            <Ionicons name="people-outline" size={18} color="#7c3aed" />
            <Text style={styles.statNum}>{stats.total}</Text>
            <Text style={styles.statLabel}>Tổng số KH</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: "#eff6ff" }]}>
            <Ionicons name="man-outline" size={18} color="#0284c7" />
            <Text style={styles.statNum}>{stats.male}</Text>
            <Text style={styles.statLabel}>Nam</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: "#fdf2f8" }]}>
            <Ionicons name="woman-outline" size={18} color="#db2777" />
            <Text style={styles.statNum}>{stats.female}</Text>
            <Text style={styles.statLabel}>Nữ</Text>
          </View>
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
            placeholder="Tìm theo tên, SĐT, email..."
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1 }}
          />
        </View>
      </View>

      {/* Danh sách */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={{ marginTop: 10, color: "#666" }}>
            Đang tải dữ liệu...
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          style={{ marginTop: 10 }}
          onEndReached={loadMoreUsers}
          onEndReachedThreshold={0.05}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                style={{ marginVertical: 12 }}
                size="small"
                color="gray"
              />
            ) : null
          }
          ListEmptyComponent={
            <Text
              style={{ textAlign: "center", marginTop: 20, color: "#666" }}
            >
              Không có khách hàng
            </Text>
          }
        />
      )}
      <CustomerDetailModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        customer={selectedUser}
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
    backgroundColor: "#f97316",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addText: { color: "#fff", fontWeight: "600", marginLeft: 4 },

  statRow: { flexDirection: "row", justifyContent: "space-between" },
  statBox: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  statNum: { fontSize: 18, fontWeight: "700", color: "#111" },
  statLabel: { fontSize: 12, color: "#555" },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 12,
  },

  userCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userName: { fontSize: 18, fontWeight: "700", color: "#111" },
  genderTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  userText: {
    color: "#111",
    fontSize: 14,
  },
  userTextRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  
  row: { flexDirection: "row", marginTop: 8, gap: 6 },
  tagPurple: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f3ff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagTextPurple: {
    color: "#7c3aed",
    marginLeft: 3,
    fontSize: 12,
    fontWeight: "500",
  },
  tagGreen: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagTextGreen: {
    color: "#059669",
    marginLeft: 3,
    fontSize: 12,
    fontWeight: "500",
  },
  updatedText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 6,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 6,
  },
  detailBtn: { flexDirection: "row", alignItems: "center" },
  editBtn: { flexDirection: "row", alignItems: "center" },
  detailText: { color: "#2563eb", marginLeft: 4, fontSize: 13 },
  editText: { color: "#92400e", marginLeft: 4, fontSize: 13 },

  centerBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  tagOrange: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagTextOrange: {
    color: "#b45309",
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "500",
  },
  
});
