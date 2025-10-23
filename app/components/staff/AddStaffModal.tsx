import { addDocument, getAllDocuments } from "@/services/firestoreService";
import { getRoleStaffFromName } from "@/utils/helpers";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import ActionSheet from "react-native-actionsheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { Staff } from "@/app/types/staff";

interface Props{
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AddProductModal({visible, onClose, onSuccess }: Props){
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [salary, setSalary] = useState("");
    const [phone, setPhone] = useState("");
    const [gender, setGender] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [address, setAddress] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [role, setRole] = useState("");

    const ROLE_STAFF = ["chef", "accountant", "shipper", "cleaner"];
    const [roles] = useState<string[]>(ROLE_STAFF);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const animatedHeight = useRef(new Animated.Value(0)).current;
    const OPTION_HEIGHT = 40; // chiều cao 1 option
    const MAX_VISIBLE_OPTIONS = 5; // tối đa 3 option
    const actionSheetRef = useRef<ActionSheet>(null);
    const TEMP_IMAGE_KEY = "@temp_product_image";

    const [loading, setLoading] = useState(false);

    const clearTempImage = async () => {
      try {
        await AsyncStorage.removeItem(TEMP_IMAGE_KEY);
        setImage(null);
      } catch (err) {
        console.error(" Lỗi xóa ảnh tạm:", err);
      }
    };
    const saveTempImage = async (base64: string) => {
      try {
        await AsyncStorage.setItem(TEMP_IMAGE_KEY, base64);
        setImage(base64);
      } catch (err) {
        console.error(" Lỗi lưu ảnh tạm:", err);
      }
    };

    useEffect(() => {
      if (visible) {
        clearTempImage();
      }
    }, [visible]);

    useEffect(() => {
      const visibleCount = Math.min(roles.length, MAX_VISIBLE_OPTIONS);
      Animated.timing(animatedHeight, {
        toValue: dropdownOpen ? visibleCount * OPTION_HEIGHT : 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }, [dropdownOpen, roles]);

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

    const resetForm = async () => {
        setName("");
        setEmail("");
        setSalary("");
        setPhone("");
        setRole("");
        setAddress("");
        setBirthDate("");
        setImage(null);
        await AsyncStorage.removeItem(TEMP_IMAGE_KEY);
    };
    
    const handleChooseImage = () => {
      actionSheetRef.current?.show();
    };

    const handleBirthDateChange = (text: string) => {
        // Xóa ký tự không phải số
        const clean = text.replace(/[^\d]/g, "");
      
        // Tự thêm dấu "/" sau 2 và 4 ký tự
        let formatted = clean;
        if (clean.length > 2 && clean.length <= 4) {
          formatted = `${clean.slice(0, 2)}/${clean.slice(2)}`;
        } else if (clean.length > 4) {
          formatted = `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4, 8)}`;
        }
      
        setBirthDate(formatted);
    };

    const handleAdd = async () => {
        const numericSalary = Number(salary);
      
        // ✅ Kiểm tra trống
        if (
          !name.trim() ||
          !email.trim() ||
          !phone.trim() ||
          !gender.trim() ||
          !birthDate.trim() ||
          !role.trim() ||
          !salary.trim()
        ) {
          Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
          return;
        }
      
        // ✅ Kiểm tra tên chỉ chứa chữ
        const nameRegex = /^[A-Za-zÀ-ỹ\s]+$/;
        if (!nameRegex.test(name)) {
          Alert.alert("Lỗi", "Tên chỉ được chứa chữ cái và khoảng trắng");
          return;
        }
      
        // ✅ Kiểm tra email hợp lệ
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          Alert.alert("Lỗi", "Email không hợp lệ");
          return;
        }
      
        // ✅ Kiểm tra số điện thoại hợp lệ
        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(phone)) {
          Alert.alert("Lỗi", "Số điện thoại phải có 10 số và bắt đầu bằng 0");
          return;
        }
      
        // ✅ Kiểm tra ngày sinh hợp lệ (dd/mm/yyyy)
        const birthRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
        if (!birthRegex.test(birthDate)) {
          Alert.alert("Lỗi", "Ngày sinh phải có định dạng dd/mm/yyyy");
          return;
        }
      
        // ✅ Kiểm tra lương hợp lệ
        if (!numericSalary || numericSalary <= 0) {
          Alert.alert("Lỗi", "Vui lòng nhập mức lương hợp lệ");
          return;
        }
        if (numericSalary % 1000 !== 0) {
          Alert.alert("Lỗi", "Lương phải chia hết cho 1000 (VD: 10000, 25000)");
          return;
        }
      
        try {
          setLoading(true);
      
          // 🔍 Kiểm tra trùng email hoặc số điện thoại trong Firestore
          const staffs = await getAllDocuments("staffs"); // Lấy tất cả staff
          const emailExists = staffs.some(
            (s: any) => s.email?.toLowerCase() === email.toLowerCase()
          );
          const phoneExists = staffs.some((s: any) => s.phone === phone);
      
          if (emailExists) {
            Alert.alert("Lỗi", "Email đã tồn tại trong hệ thống");
            return;
          }
          if (phoneExists) {
            Alert.alert("Lỗi", "Số điện thoại đã tồn tại trong hệ thống");
            return;
          }
      
          // ✅ Lưu ảnh
          const base64 = await AsyncStorage.getItem(TEMP_IMAGE_KEY);
      
          // ✅ Tạo nhân viên mới
          const newStaff = {
            name,
            email,
            gender,
            birthDate,
            phone,
            salary: numericSalary,
            role,
            image: base64  || "",
            createAt: new Date().toISOString(),
            updateAt: new Date().toISOString(),
          };
      
          await addDocument("staffs", newStaff);
          await clearTempImage();
      
          Toast.show({
            type: "success",
            text1: "Thêm nhân viên mới thành công ",
            position: "top",
          });
      
          resetForm();
          onClose();
          onSuccess?.();
        } catch (err: any) {
          console.error(" Lỗi thêm nhân viên:", err);
          Alert.alert("Lỗi", "Không thể thêm nhân viên, vui lòng thử lại");
        } finally {
          setLoading(false);
        }
      };

    const handleClose = async () => {
      await clearTempImage();
      onClose();
    };

return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
              <Text style={styles.title}>Thêm nhân viên mới</Text>

              <ScrollView style={{ maxHeight: 500 }}>
              <Text style={styles.label}>Tên nhân viên</Text>
              <TextInput
                  placeholder="Nhập họ tên nhân viên"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
              />

                <Text style={styles.label}>Giới tính</Text>
                <View style={styles.genderGroup}>
                {["Nam", "Nữ"].map((g) => (
                    <TouchableOpacity
                    key={g}
                    style={styles.genderOption}
                    onPress={() => setGender(g)}
                    >
                    <View style={[styles.radioCircle, gender === g && styles.radioSelected]} />
                    <Text style={styles.genderText}>{g}</Text>
                    </TouchableOpacity>
                ))}
                </View>

                <Text style={styles.label}>Ngày sinh</Text>
                <TextInput
                    value={birthDate}
                    onChangeText={handleBirthDateChange}
                    placeholder="dd/mm/yyyy"
                    keyboardType="numeric"
                    style={styles.input}
                /> 

              <Text style={styles.label}>Chức vụ</Text>
              <TouchableOpacity
                style={[
                  styles.selectBox,
                  dropdownOpen && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
                ]}
                onPress={() => setDropdownOpen(!dropdownOpen)}
              >
                <Text style={styles.selectedText}>
                  {role ? getRoleStaffFromName(role) : "Chọn chức vụ"}
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
                  {roles.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={styles.option}
                      onPress={() => {
                        setRole(item);
                        setDropdownOpen(false);
                      }}
                    >
                            <Text style={styles.optionText}>{getRoleStaffFromName(item)}</Text>
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

              <Text style={styles.label}>Lương cơ bản</Text>
              <TextInput
                  value={salary}
                  onChangeText={setSalary}
                  placeholder="0"
                  keyboardType="numeric"
                  style={styles.input}
              />         

                <Text style={styles.label}>Số điện thoại</Text>
                <TextInput
                    placeholder="Số điện thoại"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="numeric"
                    style={styles.input}
                />

                <Text style={styles.label}>Email</Text>
                <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                />      

                <Text style={styles.label}>Địa chỉ</Text>
                <TextInput
                    placeholder="Địa chỉ"
                    value={address}
                    onChangeText={setAddress}
                    style={styles.input}
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
                      <Text style={{ color: "#666", marginTop: 6 }}>Chọn hình ảnh nhân viên</Text>
                    </View>
                  )}
                </TouchableOpacity>
              <ActionSheet
                ref={actionSheetRef}
                title={"Chọn hình ảnh"}
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
                onPress={handleAdd}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Thêm nhân viên</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: "#eee" }]}
                onPress={async () => {
                  await clearTempImage();
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
      top: 291, // ngay dưới selectBox
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
    genderGroup: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 4,
        marginBottom: 10,
        paddingHorizontal: 30
      },
      genderOption: {
        flexDirection: "row",
        alignItems: "center",
      },
      genderText: {
        marginLeft: 6,
        fontSize: 14,
        color: "#333",
      },
      radioCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: "#888",
        justifyContent: "center",
        alignItems: "center",
      },
      radioSelected: {
        borderColor: "#f97316",
        backgroundColor: "#f97316",

      },
      
});
