export type DeliveryPerson = {
  id: number
  name: string
  phone: string | null
  is_active: boolean
}

export type CashierStats = {
  cashier_name: string
  total_sales: number
  total_amount: number
  by_payment_method: {
    efectivo: number
    tarjeta: number
    mercadopago: number
  }
}

export type DeliveryPersonStats = {
  delivery_person_id: number
  delivery_person_name: string
  date: string
  total_deliveries: number
  total_amount: number
}

export type DeliveryDetail = {
  id: number
  created_at: string
  total_ars: number
  payment_method: string | null
  delivery_address: string | null
  is_invoiced: boolean
}
