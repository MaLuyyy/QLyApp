
export interface Order {
    id: string;
    fullName: string;
    address: string;
    phoneNumber: string;
    paymentMethod: PaymentMethod;
    notify: string;
    items: OrderItem[];
    userId: string;
    status: string;
    totalPrice: number;
    createdAt?: string;
}
export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}
  
export interface PaymentMethod {
  cardId?: string;
}  