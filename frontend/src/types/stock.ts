export type StockMovement = {
  id: number
  product_id: number
  movement_type: "entrada" | "salida" | "ajuste"
  quantity: number
  reason: string | null
  previous_stock: number
  new_stock: number
  user_id: number | null
  sale_id: number | null
  supplier_id: number | null
  purchase_price_ars: number | null
  created_at: string
  // Joined fields
  product_name?: string
  product_category?: string
  user_name?: string
  supplier_name?: string
}

export type ProductStock = {
  product_id: number
  product_name: string
  category: string
  variant: string | null
  current_stock: number
  min_stock?: number
}

export type ProductReposition = {
  product_id: number
  product_name: string
  category: string
  variant: string | null
  current_stock: number
  min_stock: number
  units_needed: number
  suggested_supplier_id: number | null
  suggested_supplier_name: string | null
}
