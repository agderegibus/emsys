export type User = {
    id: number
    username: string
    email: string
    is_active: boolean
  }
  
  export const mockUsers: User[] = [
    { id: 1, username: "admin", email: "admin@empanadas.com", is_active: true },
    { id: 2, username: "caja1", email: "caja1@empanadas.com", is_active: true },
    { id: 3, username: "compras", email: "compras@empanadas.com", is_active: false },
  ]
  