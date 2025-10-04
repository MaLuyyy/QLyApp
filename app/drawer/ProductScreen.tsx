// app/drawer/ProductScreen.tsx
import { Product } from "@/app/types/product";
import { db } from "@/lib/firebaseConfig";
import { getCategoryFromName } from "@/utils/helpers";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
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
import ProductActionModal from "../components/product/ProductActionModal";
import { ActivityIndicator } from "react-native";
import AddProductModal from "../components/product/AddProductModal";

export default function ProductScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  const animatedHeight = useRef(new Animated.Value(0)).current;
  const OPTION_HEIGHT = 40; // chiều cao 1 option
  const MAX_VISIBLE_OPTIONS = 3; // tối đa 3 option

  const CATEGORY_ORDER = ["all", "foods", "drinks", "fruits", "snacks", "other"];
  const [categories] = useState<string[]>(CATEGORY_ORDER);

  const loadProducts = async (cat: string, searchText: string) => {
    try {
      setLoading(true);
      let q;
      if (cat === "all") {
        q = collection(db, "products");
      } else {
        q = query(collection(db, "products"), where("category", "==", cat));
      }
  
      const snapshot = await getDocs(q);
      let data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
  
      if (searchText.trim() !== "") {
        data = data.filter((p) =>
          p.name.toLowerCase().includes(searchText.toLowerCase())
        );
      }
  
      setProducts(data);
    } catch (err) {
      console.error("Lỗi lấy sản phẩm:", err);
    }
    finally {
      setLoading(false);
    }
  };
  

  const openActions = (product: Product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const closeActions = () => {
    setSelectedProduct(null);
    setModalVisible(false);
  };

  useEffect(() => {
    loadProducts(activeCat, search);
  }, [activeCat, search]);

  useEffect(() => {
    const visibleCount = Math.min(categories.length, MAX_VISIBLE_OPTIONS);
    Animated.timing(animatedHeight, {
      toValue: dropdownOpen ? visibleCount * OPTION_HEIGHT : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [dropdownOpen, categories]);
  
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
          <View style={styles.tags}>
            <Text style={[styles.tag, styles.category]}>
              {getCategoryFromName(item.category)}
            </Text>
          </View>
          <View style={styles.footer}>
            <Text style={styles.price}>{item.price.toLocaleString()} đ</Text>
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
      {/* Manager box */}
      <View style={styles.managerBox}>
        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
          <Text style={styles.addText}>+ Thêm món</Text>
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#666" style={{ marginRight: 6 }} />
          <TextInput
            placeholder="Tìm kiếm món ăn..."
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1 }}
          />
        </View>

        {/* SelectBox */}
        <View style={{ position: "relative" }}>
          <TouchableOpacity
            style={[
              styles.selectBox,
              dropdownOpen && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
            ]}
            onPress={() => setDropdownOpen(!dropdownOpen)}
          >
            <Text style={styles.selectedText}>{getCategoryFromName(activeCat)}</Text>
            <Ionicons name={dropdownOpen ? "chevron-up" : "chevron-down"} size={18} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View
        style={[
          styles.dropdownWrapper,
          {
            maxHeight: animatedHeight,
            borderBottomWidth: dropdownOpen ? 1 : 0,
          },
        ]}
      >
        <ScrollView
          style={{ flexGrow: 0 }}
          showsVerticalScrollIndicator
          nestedScrollEnabled
        >
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

      {/* Overlay render sau cùng (zIndex thấp hơn dropdown) */}
      {dropdownOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setDropdownOpen(false)}
        />
      )}
      {/* List sản phẩm */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="blue" />
          <Text style={{ marginTop: 10, color: "#666" }}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          style={{ marginTop: 10 }}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20, color: "#666" }}>
              Không có sản phẩm
            </Text>
          }
        />
      )}

      <ProductActionModal
        visible={modalVisible}
        product={selectedProduct}
        onClose={closeActions}
      />
      <AddProductModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
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
    backgroundColor: "#f97316",
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
    top: 175, // ngay dưới selectBox
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
  dropdownList: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    borderTopWidth: 0,
    backgroundColor: "#fff",
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
  tags: { flexDirection: "row", marginBottom: 4 },
  tag: {
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
    color: "#fff",
    overflow: "hidden",
  },
  category: { backgroundColor: "#f97316" },
  footer: { flexDirection: "row", alignItems: "center" },
  price: { color: "#ef4444", fontWeight: "bold", marginRight: 8 },
});
