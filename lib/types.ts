export interface Product {
  id: string;
  slug: string;
  title: string;
  category: 'all' | 'clothing' | 'watches' | 'shoes' | 'accessories';
  price: number;
  oldPrice?: number;
  discountPercent?: number;
  images: string[];
  rating: number;
  reviewsCount: number;
  sizes: string[];
  colors: {
    name: string;
    hex: string;
  }[];
  description: string;
  inStock: boolean;
  soldCount?: string;
  badge?: 'New In' | 'Best Seller' | 'Flash Sale' | 'Hot';
  specs?: {
    material?: string;
    warranty?: string;
    delivery?: string;
    stock?: string;
  };
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  selectedColor: {
    name: string;
    hex: string;
  };
  quantity: number;
}

export interface OrderCustomer {
  fullName: string;
  phone: string;
  region: string;
  address: string;
  comment?: string;
  paymentMethod: 'cash_on_delivery' | 'card_on_delivery';
}

export interface OrderSubmission {
  id: string;
  createdAt: string;
  customer: OrderCustomer;
  items: {
    id: string;
    title: string;
    price: number;
    quantity: number;
    size: string;
    color: string;
    image: string;
  }[];
  totalAmount: number;
  telegramUser?: {
    id?: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  initData?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  orderId?: string;
}
