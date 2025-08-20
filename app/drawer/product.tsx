//app/drawer/product.tsx
import React, { useEffect, useState } from "react";
import { Button, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";
import { addDocument, deleteDocument, getAllDocuments, updateDocument, } from "../../services/firestoreService";


interface Product {
  id: string;
  category: string;
  description: string;
  image: string;
  name: string;
  price: number;
}

type FormField = "category" | "description" | "image" | "name" | "price";

export default function ProductScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState<Record<FormField, string>>({
    category: "",
    description: "",
    image: "",
    name: "",
    price: "",
  });
  

  const loadData = async () => {
    const data = await getAllDocuments("products");
    setProducts(data);
    setSelectedId(null);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddForm = () => {
    setFormData({
      category: "",
      description: "",
      image: "",
      name: "",
      price: "",
    });
    setSelectedId(null);
    setModalVisible(true);
  };

  const openEditForm = () => {
    if (!selectedId) return;
    const product = products.find((p) => p.id === selectedId);
    if (product) {
      setFormData({
        category: product.category || "",
        description: product.description || "",
        image: product.image || "",
        name: product.name || "",
        price: product.price?.toString() || "",
      });
      setModalVisible(true);
    }
  };

  const handleSave = async () => {
    if (selectedId) {
      await updateDocument("products", selectedId, {
        ...formData,
        price: parseFloat(formData.price),
      });
    } else {
      await addDocument("products", {
        ...formData,
        price: parseFloat(formData.price),
      });
    }
    setModalVisible(false);
    loadData();
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    await deleteDocument("products", selectedId);
    loadData();
  };

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.item, selectedId === item.id && styles.selectedItem]}
      onPress={() => setSelectedId(item.id)}
    >
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>{item.price}₫</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <Button title="Thêm" onPress={openAddForm} />
        <Button title="Sửa" onPress={openEditForm} disabled={!selectedId} />
        <Button title="Xóa" onPress={handleDelete} disabled={!selectedId} />
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />

      {/* Form Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={styles.form}>
          <Text style={styles.formTitle}>
            {selectedId ? "Sửa sản phẩm" : "Thêm sản phẩm"}
          </Text>

          {(["category", "description", "image", "name", "price"] as FormField[]).map(
            (field) => (
              <View key={field} style={styles.inputGroup}>
                <Text style={styles.label}>{field}</Text>
                <TextInput
                  style={styles.input}
                  value={formData[field]}
                  onChangeText={(text) =>
                    setFormData({ ...formData, [field]: text })
                  }
                  keyboardType={field === "price" ? "numeric" : "default"}
                />
              </View>
            )
          )}

          <Button title="Lưu" onPress={handleSave} />
          <Button title="Hủy" color="red" onPress={() => setModalVisible(false)} />
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  selectedItem: { backgroundColor: "#d0ebff" },
  name: { fontSize: 16, fontWeight: "bold" },
  price: { color: "green" },
  form: { flex: 1, padding: 16 },
  formTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 20 },
  inputGroup: { marginBottom: 15 },
  label: { marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 5,
  },
});
