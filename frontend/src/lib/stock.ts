import { apiGet, apiPost } from "./api"
import type { StockMovement, ProductStock, ProductReposition } from "@/types/stock"

export async function createStockMovement(data: {
  product_id: number
  movement_type: "entrada" | "salida" | "ajuste"
  quantity: number
  reason?: string
  user_id?: number
  supplier_id?: number
  purchase_price_ars?: number
}) {
  return apiPost<StockMovement>("/stock/movements", data)
}

export async function listStockMovements(params?: {
  limit?: number
  offset?: number
  product_id?: number
}) {
  const query = new URLSearchParams()
  if (params?.limit) query.set("limit", params.limit.toString())
  if (params?.offset) query.set("offset", params.offset.toString())
  if (params?.product_id) query.set("product_id", params.product_id.toString())

  const url = `/stock/movements${query.toString() ? `?${query}` : ""}`
  return apiGet<StockMovement[]>(url)
}

export async function getStockLevels() {
  return apiGet<ProductStock[]>("/stock/levels")
}

export async function getProductStock(productId: number) {
  return apiGet<ProductStock>(`/stock/product/${productId}`)
}

export async function getRepositionNeeds() {
  return apiGet<ProductReposition[]>("/stock/reposition")
}
