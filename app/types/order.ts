
export interface Order {
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
interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}
  
interface PaymentMethod {
  cardId?: string;
}  