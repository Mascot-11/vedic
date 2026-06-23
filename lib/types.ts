export type Role = "superadmin" | "owner" | "staff";

export type PaymentStatus = "paid" | "credit" | "partially_paid";
export type OrderStatus = "open" | "closed";
export type PoolType = "retail" | "brewing";
export type ProductType = "drink" | "retail_bean" | "simple";
export type StockReason =
  | "sale"
  | "sale_reversal"
  | "restock"
  | "allocation"
  | "adjustment"
  | "waste";

export interface User {
  id: string;
  name: string;
  role: Role;
  auth_id: string;
  active: boolean;
  created_at: string;
}

export interface ShopSettings {
  id: string;
  business_name: string;
  currency: string;
  tax_percent: number;
  max_staff_discount_amount: number;
  low_stock_default_threshold: number;
}

export interface Table {
  id: string;
  label: string;
  active: boolean;
}

export interface Order {
  id: string;
  table_id: string;
  status: OrderStatus;
  opened_by: string;
  opened_at: string;
  closed_by: string | null;
  closed_at: string | null;
  subtotal_amount: number;
  discount_amount: number;
  discount_reason: string | null;
  total_amount: number;
  payment_status: PaymentStatus | null;
  customer_id: string | null;
  amount_paid: number;
  balance_due: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_type: ProductType;
  qty: number;
  unit_price: number;
  subtotal: number;
  added_by: string;
  added_at: string;
}

export interface Customer {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface Payment {
  id: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  received_by: string;
  timestamp: string;
  note: string | null;
}

export interface PaymentAllocation {
  id: string;
  payment_id: string;
  order_id: string;
  amount_applied: number;
}

export interface DrinkProduct {
  id: string;
  name: string;
  category: string;
  bean_type_used: string;
  grams_per_serving: number;
  price: number;
  active: boolean;
}

export interface RetailStock {
  id: string;
  bean_type: string;
  packaging_size: string;
  qty_available: number;
  selling_price: number;
}

export interface SimpleProduct {
  id: string;
  name: string;
  category: string;
  qty_available: number;
  cost_price: number;
  selling_price: number;
  low_stock_threshold: number;
}

export interface BeanBatch {
  id: string;
  bean_type: string;
  roast_date: string;
  supplier: string;
  cost_per_kg: number;
  qty_received_grams: number;
  added_by: string;
  created_at: string;
}

export interface StockAllocation {
  id: string;
  from_batch_id: string;
  to_pool: PoolType;
  qty_grams: number;
  allocated_by: string;
  timestamp: string;
}

export interface BrewingStock {
  id: string;
  bean_type: string;
  qty_remaining_grams: number;
  low_stock_threshold_grams: number;
}

export interface StockMovement {
  id: string;
  pool_type: PoolType | "simple";
  ref_id: string;
  change_qty: number;
  reason: StockReason;
  actor_id: string;
  timestamp: string;
  note: string | null;
}

export interface DiscountLog {
  id: string;
  order_id: string;
  amount: number;
  reason: string | null;
  applied_by: string;
  timestamp: string;
}

// Joined / view types
export interface OrderWithTable extends Order {
  table: Table;
  items: (OrderItem & { product_name: string })[];
}

export interface CustomerWithBalance extends Customer {
  total_balance: number;
  unpaid_orders: (Order & { table_label: string })[];
}
