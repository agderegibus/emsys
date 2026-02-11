import { apiGet } from "@/lib/api"
import type { Product } from "@/types/product"

export function listProducts() {
  return apiGet<Product[]>("/products")
}
