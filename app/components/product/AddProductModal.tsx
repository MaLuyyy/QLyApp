import { Product } from "@/app/types/product";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Modal, ScrollView, TextInput, TouchableOpacity, View, StyleSheet, Text, Image, Alert, ActivityIndicator, Animated } from "react-native";
import { addDocument } from "@/services/firestoreService";
import { getCategoryFromName } from "@/utils/helpers";

interface Props{
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AddProductModal({visible, onClose, onSuccess }: Props){
    const[name, setName] = useState("");
    const[category, setCategory] = useState("");
    const[price, setPrice] = useState("");
    const [desc, setDesc] = useState("");
    const [image, setImage] = useState<string | null>(null);

    const CATEGORY_ORDER = ["foods", "drinks", "fruits", "snacks", "other"];
    const [categories] = useState<string[]>(CATEGORY_ORDER);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const animatedHeight = useRef(new Animated.Value(0)).current;
    const OPTION_HEIGHT = 40; // chiều cao 1 option
    const MAX_VISIBLE_OPTIONS = 3; // tối đa 3 option

    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setName("");
        setCategory("");
        setPrice("");
        setDesc("");
        setImage(null);
    };

    useEffect(() => {
      const visibleCount = Math.min(categories.length, MAX_VISIBLE_OPTIONS);
      Animated.timing(animatedHeight, {
        toValue: dropdownOpen ? visibleCount * OPTION_HEIGHT : 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }, [dropdownOpen, categories]);
    
    const handleChooseImage = () => {
        // TODO: bạn có thể tích hợp expo-image-picker
        console.log("Chọn ảnh");
    };

    const handleAdd = async () => {
      const numericPrice = Number(price);
      if (!name.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập tên món ăn");
        return;
      }
      if (!category.trim()) {
        Alert.alert("Lỗi", "Vui lòng chọn danh mục");
        return;
      }
      if (!numericPrice || numericPrice <= 0) {
        Alert.alert("Lỗi", "Vui lòng nhập giá hợp lệ");
        return;
      }
      if (numericPrice % 1000 !== 0) {
        Alert.alert("Lỗi", "Giá phải chia hết cho 1000 (VD: 10000, 25000)");
        return;
      }

      const newProduct = {
        name,
        category,
        price: numericPrice,
        desc,
        image: image || "",
      };
  
      try {
        setLoading(true);
        const id = await addDocument("products", newProduct);
        console.log("Đã thêm sản phẩm mới:", id);
        Alert.alert("Thành công", "Đã thêm món ăn mới!");
        resetForm();
        onClose();
        onSuccess?.();
      } catch (err: any) {
        console.error("Lỗi thêm sản phẩm:", err);
        Alert.alert("Lỗi", "Không thể thêm món ăn, vui lòng thử lại");
      } finally {
        setLoading(false);
      }
    };

return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
              <Text style={styles.title}>Thêm món ăn mới</Text>

              <ScrollView style={{ maxHeight: 500 }}>
              <Text style={styles.label}>Tên món</Text>
              <TextInput
                  placeholder="Nhập tên món ăn"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
              />

              <Text style={styles.label}>Danh mục</Text>
              <TouchableOpacity
                style={[
                  styles.selectBox,
                  dropdownOpen && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
                ]}
                onPress={() => setDropdownOpen(!dropdownOpen)}
              >
                <Text style={styles.selectedText}>
                  {category ? getCategoryFromName(category) : "Chọn danh mục"}
                </Text>
                <Ionicons name={dropdownOpen ? "chevron-up" : "chevron-down"} size={18} color="#333" />
              </TouchableOpacity>

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
                        setCategory(item);
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
                  style={styles.overlayCate}
                  activeOpacity={1}
                  onPress={() => setDropdownOpen(false)}
                />
              )}

              <Text style={styles.label}>Giá (VND)</Text>
              <TextInput
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0"
                  keyboardType="numeric"
                  style={styles.input}
              />

              <Text style={styles.label}>Mô tả</Text>
              <TextInput
                  placeholder="Mô tả món ăn"
                  value={desc}
                  onChangeText={setDesc}
                  multiline
                  style={[styles.input, { height: 80, textAlignVertical: "top" }]}
              />

              <Text style={styles.label}>Hình ảnh</Text>
              <TouchableOpacity style={styles.imageBox} onPress={handleChooseImage}>
                  {image ? (
                  <Image source={{ uri: image }} style={{ width: "100%", height: "100%" }} />
                  ) : (
                  <View style={{ alignItems: "center" }}>
                      <Ionicons name="image-outline" size={30} color="#999" />
                      <Text style={{ color: "#666", marginTop: 6 }}>Chọn hình ảnh món ăn</Text>
                  </View>
                  )}
              </TouchableOpacity>
              </ScrollView>

              {/* Buttons */}
              <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: "#f97316" }]}
                onPress={handleAdd}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Thêm món</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: "#eee" }]}
                onPress={() => {
                  resetForm();
                  onClose();
                }}
                disabled={loading}
              >
                <Text>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
    </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 16 },
    modalBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    },
    title: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 12 },
    label: { marginTop: 10, marginBottom: 4, fontWeight: "500" },
    input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    },
    selectBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    },
    imageBox: {
    height: 120,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
    },
    footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
    btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
    },
    selectedText: { fontSize: 14, color: "#333" },
    dropdownWrapper: {
      position: "absolute",
      top: 149, // ngay dưới selectBox
      left: 0,
      right: 0,
      marginHorizontal: 0,
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
    overlayCate: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "transparent",
      zIndex: 1000,
    },
});
