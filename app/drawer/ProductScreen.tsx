// app/drawer/ProductScreen.tsx
import { Product } from "@/app/types/product";
import { getDocumentsWithPagination } from "@/services/firestoreService";
import { getCategoryFromName } from "@/utils/helpers";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AddProductModal from "../components/product/AddProductModal";
import ProductActionModal from "../components/product/ProductActionModal";
import EditProductModal from "../components/product/EditProductModal";

export default function ProductScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageToken, setPageToken] = useState<string | null>(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const animatedHeight = useRef(new Animated.Value(0)).current;
  const OPTION_HEIGHT = 40;
  const MAX_VISIBLE_OPTIONS = 3;

  const CATEGORY_ORDER = ["all", "foods", "drinks", "fruits", "snacks", "other"];
  const [categories] = useState<string[]>(CATEGORY_ORDER);

  // --- Gọi API load sản phẩm ---
  const loadProducts = async (cat: string, searchText: string) => {
    try {
      setLoading(true);
  
      // Gọi trang đầu
      const res = await getDocumentsWithPagination("products", 10);
      let allDocs = res.documents;
  
      // Nếu ít hơn 10 mà vẫn còn trang tiếp, load thêm
      if (res.documents.length < 10 && res.nextPageToken) {
        const res2 = await getDocumentsWithPagination("products", 10, res.nextPageToken);
        allDocs = [...res.documents, ...res2.documents];
        setPageToken(res2.nextPageToken || null);
      } else {
        setPageToken(res.nextPageToken || null);
      }
  
      // Lọc theo category
      if (cat !== "all") {
        allDocs = allDocs.filter((p: Product) => p.category === cat);
      }
  
      // Lọc theo từ khóa tìm kiếm
      if (searchText.trim() !== "") {
        allDocs = allDocs.filter((p: Product) =>
          p.name.toLowerCase().includes(searchText.toLowerCase())
        );
      }
  
      setProducts(allDocs);
    } catch (err) {
      console.error("Lỗi lấy sản phẩm:", err);
    } finally {
      setLoading(false);
    }
  };
  

  // --- Load thêm khi cuộn xuống ---
  const loadMoreProducts = async () => {
    if (!pageToken || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getDocumentsWithPagination("products", 10, pageToken);
      let data = res.documents;

      if (activeCat !== "all") {
        data = data.filter((p:Product) => p.category === activeCat);
      }

      if (search.trim() !== "") {
        data = data.filter((p:Product) =>
          p.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      setProducts((prev) => [...prev, ...data]);
      setPageToken(res.nextPageToken || null);
    } catch (err) {
      console.error("Lỗi load thêm sản phẩm:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Khi màn hình focus hoặc đổi category/search
  useFocusEffect(
    useCallback(() => {
      loadProducts(activeCat, search);
    }, [activeCat, search])
  );

  // Dropdown animation
  useEffect(() => {
    const visibleCount = Math.min(categories.length, MAX_VISIBLE_OPTIONS);
    Animated.timing(animatedHeight, {
      toValue: dropdownOpen ? visibleCount * OPTION_HEIGHT : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [dropdownOpen, categories]);

  const openActions = (product: Product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const closeActions = () => {
    setSelectedProduct(null);
    setModalVisible(false);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.cardWrapper}>
      <View style={styles.card}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imageBox}>
            <Ionicons name="image-outline" size={30} color="#999" />
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.footer}>
            <Text style={styles.price}>{item.price.toLocaleString()} đ</Text>
          </View>
          <View style={styles.tags}>
            <Text 
            style={[styles.tag, 
              {
                backgroundColor: item.quantity === 0 
                ? "#ef4444"
                : item.quantity <=10
                ? "#f97316" 
                : "#22c55e"
              }]}>
              Số lượng: {item.quantity}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => openActions(item)} style={{ padding: 6 }}>
          <Ionicons name="ellipsis-vertical" size={20} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header / Bộ lọc */}
      <View style={styles.managerBox}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddModalVisible(true)}
        >
          <Text style={styles.addText}>+ Thêm món</Text>
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={18}
            color="#666"
            style={{ marginRight: 6 }}
          />
          <TextInput
            placeholder="Tìm kiếm món ăn..."
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
              {getCategoryFromName(activeCat)}
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
          {categories.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.option}
              onPress={() => {
                setActiveCat(item);
                setDropdownOpen(false);
              }}
            >
              <Text style={styles.optionText}>{getCategoryFromName(item)}</Text>
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
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          style={{ marginTop: 10 }}
          onEndReached={loadMoreProducts} // gọi khi cuộn gần cuối
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

      {/* Modals */}
      <ProductActionModal
        visible={modalVisible}
        product={selectedProduct}
        onClose={closeActions}
        onDeleted={(id) => {
          setProducts((prev) => prev.filter((p) => p.id !== id)); // xoá ngay khỏi danh sách
        }}
        onEdit={(product) => {
          setEditingProduct(product);
          setEditModalVisible(true);
        }}
      />
      <AddProductModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSuccess={() => loadProducts(activeCat, search)}
      />
      <EditProductModal
        visible={editModalVisible}
        product={editingProduct}
        onClose={() => setEditModalVisible(false)}
        onSuccess={() => loadProducts(activeCat, search)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eee", padding: 12 },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 1000,
  },
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
  addButton: {
    backgroundColor: "#87CEEB",
    alignSelf: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  addText: { color: "#fff", fontWeight: "bold" },
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
    top: 175,
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
  cardWrapper: { borderRadius: 10, overflow: "hidden" },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1.2,
    alignItems: "center",
  },
  imageBox: {
    width: 50,
    height: 50,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#f3f4f6",
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "bold", marginBottom: 4 },
  tags: { flexDirection: "row"},
  tag: {
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
    color: "#fff",
    overflow: "hidden",
  },
  footer: { flexDirection: "row", alignItems: "center", marginBottom: 4  },
  price: { color: "#ef4444", fontWeight: "bold", marginRight: 8 },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center" },
});
