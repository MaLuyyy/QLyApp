export interface Customer {
    id: string;
    name: string;
    email: string;
    gender: string;
    birthDate: string;
    phone: string;
    orderCount?: number; 
    image?:string;
    createdAt: string;
    updatedAt: string;
}
  