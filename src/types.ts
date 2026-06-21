export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  isVeg: boolean;
  isBestseller?: boolean;
  isChefSpecial?: boolean;
  image: string;
  spiciness: number; // 0 to 3 index of chili levels
  rating: number; // e.g. 4.5 to 4.9
  ratingCount: number;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  customization?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name or emoji
  description: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  date: string;
  comment: string;
  avatar: string;
}

export type KOTStatus = "New Order" | "Accepted" | "Preparing" | "Ready" | "Served" | "Cancelled";

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  customization?: string;
}

export interface KOT {
  id: string; // Format: KOT-0001, etc.
  orderId: string;
  tableNumber: string;
  customerName: string;
  orderType: "dine-in" | "takeaway" | "delivery";
  status: KOTStatus;
  specialInstructions: string;
  createdAt: string;
  preparationTime: number; // Duration in minutes to prepare
  printed?: boolean; // Tracking thermal/POS ticket layout generation
  items: {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    customization?: string;
  }[];
}

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  capacity: number;
  seatingArea: string;
  status: "Available" | "Occupied" | "Reserved";
}
