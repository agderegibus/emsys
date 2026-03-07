export type ProductCategory = "Empanadas" | "Bebidas" | "Combos"

export type Product = {
  id: number
  name: string
  category: ProductCategory
  price: number // ARS
  sku?: string
  is_active: boolean
  description?: string
}

export const mockProducts: Product[] = [
  {
    id: 1,
    name: "Empanada Carne Suave",
    category: "Empanadas",
    price: 1200,
    sku: "EMP-CAR-SUA",
    is_active: true,
    description: "Carne suave, cebolla, condimentos.",
  },
  {
    id: 2,
    name: "Empanada Jamón y Queso",
    category: "Empanadas",
    price: 1200,
    sku: "EMP-JYQ",
    is_active: true,
  },
  {
    id: 3,
    name: "Gaseosa 500ml",
    category: "Bebidas",
    price: 1800,
    sku: "BEB-GAS-500",
    is_active: true,
  },
]
