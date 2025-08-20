// app/drawer/order.tsx
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAllDocuments } from "../../services/firestoreService";

// Kiểu dữ liệu trong order
interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

interface PaymentMethod {
  cardId?: string;
}

interface Order {
  id: string;
  fullName: string;
  address: string;
  phoneNumber: string;
  paymentMethod: PaymentMethod;
  notify: string;
  items: OrderItem[];
  userId: string;
  createdAt?: string;
}

export default function OrderScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadData = async () => {
    const data = await getAllDocuments("orders");
    setOrders(data as Order[]);
    setSelectedId(null);
  };

  useEffect(() => {
    loadData();
  }, []);

  const renderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={[styles.item, selectedId === item.id && styles.selectedItem]}
      onPress={() => setSelectedId(item.id)}
    >
      <Text style={styles.name}>{item.fullName}</Text>
      <Text>{item.address}</Text>
      <Text style={styles.phone}>{item.phoneNumber}</Text>
      <Text>Số SP: {item.items?.length || 0}</Text>
      <Text>
        Thanh toán: {item.paymentMethod?.cardId ? "Thẻ" : "Tiền mặt"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  selectedItem: { backgroundColor: "#d0ebff" },
  name: { fontSize: 16, fontWeight: "bold" },
  phone: { color: "green" },
});
