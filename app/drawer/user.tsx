import { getAllDocuments } from "@/services/firestoreService";
import { useEffect, useState } from "react";


interface User {
    id: string;
    name: string;
    email: string;
}

type FormField = "name" | "email" ;

export default function UserScreen(){
    const [users, setUsers] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [formData, setFormData] = useState<Record<FormField, string>>({
        name: "",
        email: "",
      });
    
    const loadData = async ()=> {
        const data = await getAllDocuments("users");
        setUsers(data);
        setSelectedId(null);
    }

    useEffect(()=> {
        loadData();
    }, []);

    const openAddForm = () => {
        setFormData({
            name: "",
            email: "",
        });
        setSelectedId(null);
    }

    const openEditForm = () => {
        if(!selectedId) return;
        const user = user.find((u) => u.id === selectedId);
        if(user){
            setFormData({
                name: user.name || "",
                email: user.email || "",
            });
            
        }
    }
}