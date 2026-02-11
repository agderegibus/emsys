export type Product = {
    id: number
    category: string
    subcategory?: string | null
    name: string
    variant?: string | null
    price_ars: number
    description?: string | null
    is_active: boolean
    stock_qty: number
  }
  