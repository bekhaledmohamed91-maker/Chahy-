export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  stock: number;
  category: string;
  unit?: 'kg' | 'pièce';
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
  delivery_fee: number;
  discount?: number;
  voucher_id?: string;
  store_name?: string;
  status: 'pending' | 'accepted' | 'refused' | 'delivered';
  rating?: number;
  rating_comment?: string;
  created_at: string;
  items?: OrderItem[];
  driver_id?: number;
  driver_name?: string;
}

export interface Customer {
  phone: string;
  name: string;
  points: number;
}

export interface Voucher {
  id: string;
  customer_phone: string;
  amount: number;
  used: boolean;
  created_at: string;
}

export interface Driver {
  id: number;
  name: string;
  phone: string;
  status: 'active' | 'inactive';
}
