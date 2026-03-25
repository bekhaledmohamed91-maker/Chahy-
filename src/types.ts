export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  stock: number;
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  name?: string;
}

export interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  remark?: string;
  total_price: number;
  status: 'pending' | 'delivered';
  created_at: string;
  items?: OrderItem[];
}
