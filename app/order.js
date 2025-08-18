// app/order.tsx
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAllDocuments } from "../services/firestoreService";

export default function OrderScreen(){
    const [orders, setOrders] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    
    const loadData = async() => {
      const data = await getAllDocuments("orders");
        setOrders(data);
      setSelectedId(null);
  };

  useEffect(() => {
    loadData();
    },[]);

    const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.item, selectedId === item.id && styles.selectedItem]}
      onPress={() => setSelectedId(item.id)}
    >
      <Text style={styles.name}>{item.fullName}</Text>
      <Text style={styles.phone}>{item.phoneNumber}</Text>
    </TouchableOpacity>
  );

    return(
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
  name: { fontSize: 16, fontWeight: "bold" },
  phone: { color: "green" },
});
