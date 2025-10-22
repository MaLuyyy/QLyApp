import { Product } from "@/app/types/product";
import { updateDocument } from "@/services/firestoreService";
import { getCategoryFromName } from "@/utils/helpers";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import ActionSheet from "react-native-actionsheet";
import Toast from "react-native-toast-message";


interface Props{
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    product: Product | null;
}
export default function EditProductModal({visible, onClose, onSuccess, product}: Props){
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [quantity, setQuantity] = useState("");
    
    const CATEGORY_ORDER = ["foods", "drinks", "fruits", "snacks", "other"];
    const [categories] = useState<string[]>(CATEGORY_ORDER);
    
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const animatedHeight = useRef(new Animated.Value(0)).current;
    const OPTION_HEIGHT = 40; // chiều cao 1 option
    const MAX_VISIBLE_OPTIONS = 3; // tối đa 3 option
    const actionSheetRef = useRef<ActionSheet>(null);
    const [loading, setLoading] = useState(false);
    const TEMP_IMAGE_KEY = "@temp_product_image";


    const clearTempImage = async () => {
        try {
          await AsyncStorage.removeItem(TEMP_IMAGE_KEY);
          setImage(product?.image || null);
        } catch (err) {
          console.error("❌ Lỗi xóa ảnh tạm:", err);
        }
      };

      const saveTempImage = async (base64: string) => {
        try {
          await AsyncStorage.setItem(TEMP_IMAGE_KEY, base64);
          setImage(base64);
        } catch (err) {
          console.error("❌ Lỗi lưu ảnh tạm:", err);
        }
      };

      useEffect(() => {
        if (visible && product) {
          setName(product.name || "");
          setCategory(product.category || "");
          setPrice(String(product.price || ""));
          setQuantity(String(product.quantity || ""));
          setDescription(product.description || "");
          setImage(product.image || null);
          clearTempImage();
        }
      }, [visible, product]);

      useEffect(() => {
        const visibleCount = Math.min(categories.length, MAX_VISIBLE_OPTIONS);
        Animated.timing(animatedHeight, {
          toValue: dropdownOpen ? visibleCount * OPTION_HEIGHT : 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }, [dropdownOpen, categories]);

      const pickFromCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") return Alert.alert("Cần cấp quyền camera");
    
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });
    
        if (!result.canceled && result.assets[0]) {
          const base64 = await convertImageToBase64(result.assets[0].uri);
          await saveTempImage(base64);
        }
      };
  
      const pickFromLibrary = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") return Alert.alert("Cần quyền truy cập thư viện ảnh");
    
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });
    
        if (!result.canceled && result.assets[0]) {
          const base64 = await convertImageToBase64(result.assets[0].uri);
          await saveTempImage(base64);
        }
      };
  
      const convertImageToBase64 = async (uri: string): Promise<string> => {
        let fileUri = uri;
        if (fileUri.startsWith("content://")) {
          const newPath = FileSystem.cacheDirectory + "temp_image.jpg";
          await FileSystem.copyAsync({ from: fileUri, to: newPath });
          fileUri = newPath;
        }
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return `data:image/jpeg;base64,${base64}`;
      };

      const handleChooseImage = () => {
        actionSheetRef.current?.show();
      };

      const handleEdit = async () => {
        const numericPrice = Number(price);
        const numericQuantity = Number(quantity);
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
        if (isNaN(numericQuantity) || numericQuantity < 0) {
          Alert.alert("Lỗi", "Vui lòng nhập số lượng hợp lệ");
          return;
        }
        try {
          setLoading(true);
          const base64 = (await AsyncStorage.getItem(TEMP_IMAGE_KEY)) || image;
  
          const newProduct = {
            name,
            category,
            price: numericPrice,
            quantity: numericQuantity,
            description: description,
            image: base64  || "",
            updateAt: new Date().toISOString(),
          };

          if (!product?.id) throw new Error("Thiếu ID món ăn");
          const id = await updateDocument("products", product.id, newProduct);
          await clearTempImage();
          Toast.show({
            type: "success",
            text1: "Cập nhật món thành công",
            position: "top",
          })
          onClose();
          onSuccess?.();
        } catch (err: any) {
            console.error("🔥 Firestore update error:", err);
          Alert.alert("Lỗi", "Không thể sửa món ăn, vui lòng thử lại");
        } finally {
          setLoading(false);
        }
      };
      return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
              <View style={styles.modalBox}>
                  <Text style={styles.title}>Chỉnh sửa món ăn</Text>
    
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

                  <Text style={styles.label}>Số lượng</Text>
                  <TextInput
                      value={quantity}
                      onChangeText={setQuantity}
                      placeholder="0"
                      keyboardType="numeric"
                      style={styles.input}
                  />
    
                  <Text style={styles.label}>Mô tả</Text>
                  <TextInput
                      placeholder="Mô tả món ăn"
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                  />
    
                  <Text style={styles.label}>Hình ảnh</Text>
                  <TouchableOpacity style={styles.imageBox} onPress={handleChooseImage}>
                    {image ? (
                      <View style={styles.imageWrapper}>
                        <Image
                          source={{ uri: image }}
                          style={styles.fullImage}
                          resizeMode="cover"
                        />
                      </View>
                    ) : (
                      <View style={styles.placeholder}>
                        <Ionicons name="image-outline" size={30} color="#999" />
                        <Text style={{ color: "#666", marginTop: 6 }}>Chọn hình ảnh món ăn</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <ActionSheet
                    ref={actionSheetRef}
                    title={"Chọn hình ảnh món ăn"}
                    options={["Chụp ảnh", "Chọn từ thư viện", "Hủy"]}
                    cancelButtonIndex={2}
                    onPress={(index) => {
                      if (index === 0) pickFromCamera();
                      if (index === 1) pickFromLibrary();
                    }}
                  />
    
    
    
                  </ScrollView>
    
                  {/* Buttons */}
                  <View style={styles.footer}>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: "#f97316" }]}
                    onPress={handleEdit}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={{ color: "#fff", fontWeight: "bold" }}>Sửa món</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: "#eee" }]}
                    onPress={async () => {
                      await clearTempImage();
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
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          justifyContent: "center",
          alignItems: "center",
          marginTop: 6,
          padding: 1,
          overflow: "hidden",
          backgroundColor: "#fff",
          minHeight: 120, // để có khung ban đầu khi chưa chọn ảnh
        },
        imageWrapper: {
          width: "100%",
          borderRadius: 8,
          overflow: "hidden",
        },
        fullImage: {
          width: "100%",
          aspectRatio: 1, // ảnh vuông, auto co theo tỉ lệ
          borderRadius: 8,
        },
        placeholder: {
          alignItems: "center",
          justifyContent: "center",
          height: 120,
          width: "100%",
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