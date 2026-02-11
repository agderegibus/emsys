import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import type { Product } from "@/types/product"
import { listProducts } from "@/lib/products"
import { apiGet, apiPost } from "@/lib/api"

type Customer = {
  id: number
  name: string
  phone?: string | null
  email?: string | null
  address?: string | null
  created_at?: string
}

type CartLine = {
  product: Product
  qty: number
}

type SaleOut = {
  id: number
  created_at: string
  customer_id: number | null
  is_invoiced: boolean
  total_ars: number
  payment_method: "efectivo" | "tarjeta" | "mercadopago" | null
  cashier: string | null
  is_delivery: boolean
  delivery_address: string | null
  delivery_person_id: number | null
  items: { product_id: number; qty: number; unit_price_ars: number; line_total_ars: number }[]
}

type SubcategoryGroup = {
  subcategory: string
  category: string
  count: number
  products: Product[]
}

function formatARS(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value)
}

export default function POS() {
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [q, setQ] = useState("")
  const [cart, setCart] = useState<CartLine[]>([])
  const [isInvoiced, setIsInvoiced] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta" | "mercadopago" | "">("")
  const [cashier, setCashier] = useState("")
  const [availableCashiers, setAvailableCashiers] = useState<string[]>([])

  // Delivery states
  const [isDelivery, setIsDelivery] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [deliveryProduct, setDeliveryProduct] = useState<Product | null>(null)

  // Grouping states
  const [isGrouped, setIsGrouped] = useState(true)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)

  // customers
  const [customerQuery, setCustomerQuery] = useState("")
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // create customer modal
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerPhone, setNewCustomerPhone] = useState("")
  const [newCustomerEmail, setNewCustomerEmail] = useState("")
  const [newCustomerAddress, setNewCustomerAddress] = useState("")

  // recent sales
  const [recent, setRecent] = useState<SaleOut[]>([])
  const [loadingRecent, setLoadingRecent] = useState(true)
  const [selectedSale, setSelectedSale] = useState<SaleOut | null>(null)

  // delivery persons
  const [deliveryPersons, setDeliveryPersons] = useState<{ id: number; name: string }[]>([])
  const [assigningDelivery, setAssigningDelivery] = useState(false)

  useEffect(() => {
    setLoadingProducts(true)
    listProducts()
      .then(setProducts)
      .catch(() => toast.error("No se pudieron cargar productos"))
      .finally(() => setLoadingProducts(false))
  }, [])

  useEffect(() => {
    loadRecent()
    loadCashiers()
    loadDeliveryPersons()
  }, [])

  async function loadCashiers() {
    try {
      const data = await apiGet<{ cashiers: string[] }>("/pos/predefined-cashiers")
      setAvailableCashiers(data.cashiers)
    } catch {
      toast.error("No se pudieron cargar los cajeros")
    }
  }

  async function loadDeliveryPersons() {
    try {
      const data = await apiGet<{ id: number; name: string; is_active: boolean }[]>("/delivery-persons")
      setDeliveryPersons(data.filter(dp => dp.is_active))
    } catch {
      console.error("No se pudieron cargar los cadetes")
    }
  }

  async function assignDeliveryPerson(saleId: number, deliveryPersonId: number) {
    setAssigningDelivery(true)
    try {
      await apiPost("/pos/sales/assign-delivery-person", {
        sale_id: saleId,
        delivery_person_id: deliveryPersonId
      })
      toast.success("Cadete asignado exitosamente")
      loadRecent() // Reload sales to show updated data

      // Update selectedSale if it's still open
      if (selectedSale && selectedSale.id === saleId) {
        setSelectedSale({
          ...selectedSale,
          delivery_person_id: deliveryPersonId
        })
      }
    } catch (e: any) {
      toast.error(e?.message || "No se pudo asignar el cadete")
    } finally {
      setAssigningDelivery(false)
    }
  }

  // Load delivery product when component mounts
  useEffect(() => {
    const deliveryProd = products.find(p => p.name === "Delivery" && p.category === "Servicios")
    setDeliveryProduct(deliveryProd || null)
  }, [products])

  // Auto-add/remove delivery product from cart when isDelivery changes
  useEffect(() => {
    if (!deliveryProduct) return

    const hasDelivery = cart.some(line => line.product.id === deliveryProduct.id)

    if (isDelivery && !hasDelivery) {
      // Add delivery to cart
      setCart(prev => [...prev, { product: deliveryProduct, qty: 1 }])
    } else if (!isDelivery && hasDelivery) {
      // Remove delivery from cart
      setCart(prev => prev.filter(line => line.product.id !== deliveryProduct.id))
    }
  }, [isDelivery, deliveryProduct, cart])

  async function loadRecent() {
    setLoadingRecent(true)
    try {
      const data = await apiGet<SaleOut[]>("/pos/sales/recent?limit=10")
      setRecent(data)
    } catch {
      toast.error("No se pudo cargar el historial")
    } finally {
      setLoadingRecent(false)
    }
  }

  const filteredProducts = useMemo(() => {
    const query = q.trim().toLowerCase()
    let result = products

    if (query) {
      result = products.filter((p) => {
        const hay = `${p.name} ${p.variant ?? ""} ${p.category} ${p.subcategory ?? ""}`.toLowerCase()
        return hay.includes(query)
      })
    }

    // If grouped and a subcategory is selected, filter by it
    if (isGrouped && selectedSubcategory) {
      result = result.filter((p) => (p.subcategory || "Sin subcategoría") === selectedSubcategory)
    }

    return query ? result.slice(0, 80) : result.slice(0, 50)
  }, [products, q, isGrouped, selectedSubcategory])

  // Group products by subcategory
  const subcategoryGroups = useMemo(() => {
    const groups = new Map<string, SubcategoryGroup>()

    products.forEach((p) => {
      const key = p.subcategory || "Sin subcategoría"
      if (!groups.has(key)) {
        groups.set(key, {
          subcategory: key,
          category: p.category,
          count: 0,
          products: []
        })
      }
      const group = groups.get(key)!
      group.count++
      group.products.push(p)
    })

    return Array.from(groups.values()).sort((a, b) => a.subcategory.localeCompare(b.subcategory))
  }, [products])

  const total = useMemo(() => cart.reduce((acc, l) => acc + l.product.price_ars * l.qty, 0), [cart])

  function addToCart(p: Product) {
    if (!p.is_active) return toast.error("Producto inactivo")
    if ((p.stock_qty ?? 0) <= 0) return toast.error("Sin stock")
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.product.id === p.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 }
        return copy
      }
      return [{ product: p, qty: 1 }, ...prev]
    })
    toast.success(`${p.name} agregado`)
  }

  function decQty(productId: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.product.id === productId ? { ...l, qty: l.qty - 1 } : l))
        .filter((l) => l.qty > 0)
    )
  }

  function incQty(productId: number) {
    setCart((prev) =>
      prev.map((l) => (l.product.id === productId ? { ...l, qty: l.qty + 1 } : l))
    )
  }

  function removeLine(productId: number) {
    setCart((prev) => prev.filter((l) => l.product.id !== productId))
  }

  async function searchCustomers(value: string) {
    setCustomerQuery(value)
    const qq = value.trim()
    if (!qq) {
      setCustomerResults([])
      return
    }
    try {
      const data = await apiGet<Customer[]>(`/pos/customers?q=${encodeURIComponent(qq)}`)
      setCustomerResults(data)
    } catch {
      toast.error("No se pudo buscar clientes")
    }
  }

  async function createCustomer() {
    const name = newCustomerName.trim()
    const phone = newCustomerPhone.trim()
    const email = newCustomerEmail.trim()
    const address = newCustomerAddress.trim()
    if (name.length < 2) return toast.error("Nombre inválido")

    try {
      const created = await apiPost<Customer>("/pos/customers", {
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
      })
      setSelectedCustomer(created)
      setCustomerResults([])
      setCustomerQuery("")
      setNewCustomerName("")
      setNewCustomerPhone("")
      setNewCustomerEmail("")
      setNewCustomerAddress("")
      toast.success("Cliente creado")
      const modal = document.getElementById("createCustomerModal")
      if (modal) {
        const bsModal = (window as any).bootstrap.Modal.getInstance(modal)
        if (bsModal) bsModal.hide()
      }
    } catch {
      toast.error("No se pudo crear el cliente")
    }
  }

  async function confirmSale() {
    if (cart.length === 0) return toast.error("El carrito está vacío")

    // Validate delivery address if is_delivery is true
    if (isDelivery && !deliveryAddress.trim()) {
      return toast.error("Debe ingresar una dirección de entrega")
    }

    try {
      const payload = {
        customer_id: selectedCustomer?.id ?? null,
        is_invoiced: isInvoiced,
        payment_method: paymentMethod || null,
        cashier: cashier.trim() || null,
        is_delivery: isDelivery,
        delivery_address: isDelivery ? deliveryAddress.trim() : null,
        items: cart.map((l) => ({ product_id: l.product.id, qty: l.qty })),
      }

      await apiPost("/pos/sales", payload)

      toast.success("Venta registrada exitosamente")
      setCart([])
      setIsInvoiced(false)
      setSelectedCustomer(null)
      setPaymentMethod("")
      setCashier("")
      setIsDelivery(false)
      setDeliveryAddress("")

      setLoadingProducts(true)
      listProducts().then(setProducts).finally(() => setLoadingProducts(false))

      loadRecent()
    } catch (e: any) {
      toast.error(e?.message || "No se pudo registrar la venta")
    }
  }

  return (
    <>
      {/* Header con stats horizontales */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-0">
            <i className="bi bi-cart3 me-2"></i>
            Punto de Venta
          </h3>
        </div>
        <div className="d-flex gap-2">
          <span className="badge bg-secondary">
            <i className="bi bi-box me-1"></i>
            {products.length} productos
          </span>
          <span className="badge bg-primary">
            <i className="bi bi-cart-fill me-1"></i>
            {cart.length} items
          </span>
          <span className="badge bg-success">
            <i className="bi bi-cash me-1"></i>
            {formatARS(total)}
          </span>
        </div>
      </div>

      <div className="row g-3">
        {/* CATALOGO */}
        <div className="col-lg-7">
          <div className="card">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <i className="bi bi-grid-3x3-gap me-2"></i>
                Catálogo
              </h6>
              <div className="d-flex gap-2 align-items-center">
                <span className="badge bg-white text-primary">
                  {isGrouped && !selectedSubcategory ? subcategoryGroups.length : filteredProducts.length}
                </span>
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="groupToggle"
                    checked={isGrouped}
                    onChange={(e) => {
                      setIsGrouped(e.target.checked)
                      setSelectedSubcategory(null)
                    }}
                  />
                  <label className="form-check-label text-white" htmlFor="groupToggle">
                    <small>Agrupar</small>
                  </label>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="p-3 bg-light">
                <div className="input-group input-group-sm">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar productos..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ maxHeight: "550px", overflowY: "auto" }}>
                {loadingProducts ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                  </div>
                ) : isGrouped && !selectedSubcategory && !q ? (
                  // Vista de Subcategorías
                  <div className="p-3">
                    {selectedSubcategory && (
                      <button
                        className="btn btn-sm btn-outline-secondary mb-3"
                        onClick={() => setSelectedSubcategory(null)}
                      >
                        <i className="bi bi-arrow-left me-1"></i>
                        Volver a subcategorías
                      </button>
                    )}
                    <div className="row g-2">
                      {subcategoryGroups.map((group) => (
                        <div key={group.subcategory} className="col-md-6">
                          <div
                            className="card h-100 border-primary"
                            style={{ cursor: "pointer" }}
                            onClick={() => setSelectedSubcategory(group.subcategory)}
                          >
                            <div className="card-body p-3">
                              <h6 className="card-title mb-1">
                                <i className="bi bi-folder me-2 text-primary"></i>
                                {group.subcategory}
                              </h6>
                              <small className="text-muted d-block">
                                <i className="bi bi-tag me-1"></i>
                                {group.category}
                              </small>
                              <div className="mt-2">
                                <span className="badge bg-primary">
                                  {group.count} producto{group.count !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="alert alert-info m-3">
                    <i className="bi bi-info-circle me-2"></i>
                    No se encontraron productos
                  </div>
                ) : (
                  // Vista de Productos
                  <>
                    {isGrouped && selectedSubcategory && (
                      <div className="p-3 pb-0">
                        <button
                          className="btn btn-sm btn-outline-secondary mb-2"
                          onClick={() => setSelectedSubcategory(null)}
                        >
                          <i className="bi bi-arrow-left me-1"></i>
                          Volver a subcategorías
                        </button>
                        <h6 className="mb-2">
                          <i className="bi bi-folder-open me-2 text-primary"></i>
                          {selectedSubcategory}
                        </h6>
                      </div>
                    )}
                    <table className="table table-hover table-sm mb-0">
                      <thead className="table-light sticky-top">
                        <tr>
                          <th style={{width: "45%"}}>Producto</th>
                          <th style={{width: "25%"}}>Categoría</th>
                          <th style={{width: "15%"}} className="text-end">Precio</th>
                          <th style={{width: "15%"}} className="text-center">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((p) => (
                          <tr
                            key={p.id}
                            onClick={() => addToCart(p)}
                            style={{
                              cursor: p.is_active && (p.stock_qty ?? 0) > 0 ? "pointer" : "not-allowed",
                              opacity: !p.is_active || (p.stock_qty ?? 0) <= 0 ? 0.5 : 1
                            }}
                            className={p.is_active && (p.stock_qty ?? 0) > 0 ? "" : "table-danger"}
                          >
                            <td>
                              <strong>{p.name}</strong>
                              {p.variant && <><br/><small className="text-muted">{p.variant}</small></>}
                            </td>
                            <td><small className="text-muted">{p.category}</small></td>
                            <td className="text-end">
                              <strong className="text-primary">{formatARS(p.price_ars)}</strong>
                            </td>
                            <td className="text-center">
                              <span className={`badge ${(p.stock_qty ?? 0) < 10 ? 'bg-warning text-dark' : 'bg-success'}`}>
                                {p.stock_qty ?? 0}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CARRITO */}
        <div className="col-lg-5">
          <div className="card mb-3">
            <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <i className="bi bi-cart-fill me-2"></i>
                Carrito
              </h6>
              <span className="badge bg-white text-success">{cart.length} items</span>
            </div>
            <div className="card-body p-3">
              {/* Cliente y Facturación en horizontal */}
              <div className="row g-2 mb-2">
                <div className="col-8">
                  <label className="form-label form-label-sm mb-1">
                    <i className="bi bi-person me-1"></i>
                    Cliente
                  </label>
                  {selectedCustomer ? (
                    <div className="alert alert-info alert-sm p-2 mb-0 d-flex justify-content-between align-items-center">
                      <small>
                        <strong>{selectedCustomer.name}</strong>
                      </small>
                      <button
                        className="btn btn-sm btn-outline-danger py-0 px-1"
                        onClick={() => setSelectedCustomer(null)}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="input-group input-group-sm">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Buscar..."
                          value={customerQuery}
                          onChange={(e) => searchCustomers(e.target.value)}
                        />
                        <button
                          className="btn btn-outline-primary"
                          data-bs-toggle="modal"
                          data-bs-target="#createCustomerModal"
                        >
                          <i className="bi bi-plus"></i>
                        </button>
                      </div>
                      {customerResults.length > 0 && (
                        <div className="list-group mt-1" style={{fontSize: "0.85rem"}}>
                          {customerResults.map((c) => (
                            <button
                              key={c.id}
                              className="list-group-item list-group-item-action py-1 px-2"
                              onClick={() => {
                                setSelectedCustomer(c)
                                setCustomerResults([])
                                setCustomerQuery("")
                                // If delivery is active and customer has address, pre-fill it
                                if (isDelivery && c.address) {
                                  setDeliveryAddress(c.address)
                                }
                              }}
                            >
                              <strong>{c.name}</strong>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="col-4">
                  <label className="form-label form-label-sm mb-1">Facturar</label>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={isInvoiced}
                      onChange={(e) => setIsInvoiced(e.target.checked)}
                      id="invoiceSwitch"
                    />
                    <label className="form-check-label" htmlFor="invoiceSwitch">
                      <small>{isInvoiced ? "Sí" : "No"}</small>
                    </label>
                  </div>
                </div>
              </div>

              {/* Medio de pago y cajero */}
              <div className="row g-2 mb-2">
                <div className="col-7">
                  <label className="form-label form-label-sm mb-1">
                    <i className="bi bi-credit-card me-1"></i>
                    Medio de Pago
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                  >
                    <option value="">Sin especificar</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="mercadopago">MercadoPago</option>
                  </select>
                </div>
                <div className="col-5">
                  <label className="form-label form-label-sm mb-1">
                    <i className="bi bi-person-badge me-1"></i>
                    Cajero
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={cashier}
                    onChange={(e) => setCashier(e.target.value)}
                  >
                    <option value="">Sin especificar</option>
                    {availableCashiers.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Delivery section */}
              <div className="row g-2 mb-2">
                <div className="col-4">
                  <label className="form-label form-label-sm mb-1">
                    <i className="bi bi-truck me-1"></i>
                    Delivery
                  </label>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={isDelivery}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setIsDelivery(checked)
                        // If enabling delivery and customer has address, pre-fill it
                        if (checked && selectedCustomer?.address) {
                          setDeliveryAddress(selectedCustomer.address)
                        }
                      }}
                      id="deliverySwitch"
                    />
                    <label className="form-check-label" htmlFor="deliverySwitch">
                      <small>{isDelivery ? "Sí" : "No"}</small>
                    </label>
                  </div>
                </div>
                {isDelivery && (
                  <div className="col-8">
                    <label className="form-label form-label-sm mb-1">
                      <i className="bi bi-geo-alt me-1"></i>
                      Dirección de Entrega
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Ingrese dirección..."
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <hr className="my-2" />

              {/* Items del carrito */}
              <div style={{ maxHeight: "280px", overflowY: "auto" }} className="mb-2">
                {cart.length === 0 ? (
                  <div className="text-center text-muted py-3">
                    <i className="bi bi-cart-x fs-3"></i>
                    <p className="mb-0 mt-1"><small>Carrito vacío</small></p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {cart.map((l) => (
                      <div key={l.product.id} className="list-group-item px-0 py-2">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong className="mb-0" style={{fontSize: "0.9rem"}}>{l.product.name}</strong>
                          <button
                            className="btn btn-sm btn-outline-danger py-0 px-1"
                            onClick={() => removeLine(l.product.id)}
                          >
                            <i className="bi bi-trash" style={{fontSize: "0.75rem"}}></i>
                          </button>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            {formatARS(l.product.price_ars)} × {l.qty}
                          </small>
                          <div className="d-flex align-items-center gap-2">
                            <strong className="text-primary">{formatARS(l.product.price_ars * l.qty)}</strong>
                            <div className="btn-group btn-group-sm" role="group">
                              <button
                                className="btn btn-outline-secondary py-0 px-2"
                                onClick={() => decQty(l.product.id)}
                              >
                                <i className="bi bi-dash"></i>
                              </button>
                              <button className="btn btn-outline-secondary py-0 px-2" disabled style={{minWidth: "35px"}}>
                                {l.qty}
                              </button>
                              <button
                                className="btn btn-outline-secondary py-0 px-2"
                                onClick={() => incQty(l.product.id)}
                              >
                                <i className="bi bi-plus"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <hr className="my-2" />

              {/* Total y Botón */}
              <div className="bg-light p-2 rounded mb-2">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold">Total:</span>
                  <h4 className="mb-0 text-primary">{formatARS(total)}</h4>
                </div>
              </div>

              <button
                className="btn btn-success w-100"
                onClick={confirmSale}
                disabled={cart.length === 0}
              >
                <i className="bi bi-check-circle me-2"></i>
                Registrar Venta
              </button>
            </div>
          </div>

          {/* Ventas recientes - Compacto */}
          <div className="card">
            <div className="card-header py-2 d-flex justify-content-between align-items-center">
              <small className="mb-0 fw-bold">
                <i className="bi bi-clock-history me-1"></i>
                Últimas Ventas
              </small>
              <button className="btn btn-sm btn-outline-primary py-0 px-2" onClick={loadRecent}>
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
            <div className="card-body p-0">
              <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                <table className="table table-sm table-hover mb-0" style={{fontSize: "0.85rem"}}>
                  <thead className="table-light">
                    <tr>
                      <th className="py-1">#</th>
                      <th className="py-1">Total</th>
                      <th className="py-1 text-center">Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRecent ? (
                      <tr>
                        <td colSpan={3} className="text-center py-2">
                          <div className="spinner-border spinner-border-sm" role="status"></div>
                        </td>
                      </tr>
                    ) : recent.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center text-muted py-2">
                          <small>Sin ventas</small>
                        </td>
                      </tr>
                    ) : (
                      recent.map((s) => (
                        <tr
                          key={s.id}
                          style={{ cursor: "pointer" }}
                          onClick={() => setSelectedSale(s)}
                          data-bs-toggle="modal"
                          data-bs-target="#saleDetailModal"
                        >
                          <td className="py-1">#{s.id}</td>
                          <td className="py-1">
                            <strong>{formatARS(s.total_ars)}</strong>
                          </td>
                          <td className="py-1 text-center">
                            <span className="badge bg-secondary">{s.items?.length ?? 0}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear cliente */}
      <div
        className="modal fade"
        id="createCustomerModal"
        tabIndex={-1}
        aria-labelledby="createCustomerModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="createCustomerModalLabel">
                <i className="bi bi-person-plus me-2"></i>
                Crear Nuevo Cliente
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="customerName" className="form-label">
                  Nombre completo <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="customerName"
                  placeholder="Juan Pérez"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="customerEmail" className="form-label">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="customerEmail"
                  placeholder="juan@example.com"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="customerPhone" className="form-label">
                  Teléfono (opcional)
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="customerPhone"
                  placeholder="+54 11 1234-5678"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="customerAddress" className="form-label">
                  Dirección (opcional)
                </label>
                <textarea
                  className="form-control"
                  id="customerAddress"
                  placeholder="Av. Corrientes 1234, CABA"
                  rows={2}
                  value={newCustomerAddress}
                  onChange={(e) => setNewCustomerAddress(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={createCustomer}>
                <i className="bi bi-save me-1"></i>
                Guardar Cliente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para detalle de venta */}
      <div
        className="modal fade"
        id="saleDetailModal"
        tabIndex={-1}
        aria-labelledby="saleDetailModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="saleDetailModalLabel">
                <i className="bi bi-receipt me-2"></i>
                Detalle de Venta #{selectedSale?.id}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              {selectedSale && (
                <>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <p className="mb-1">
                        <strong>Fecha y hora:</strong>{" "}
                        {new Date(selectedSale.created_at).toLocaleString("es-AR")}
                      </p>
                      <p className="mb-1">
                        <strong>Estado:</strong>{" "}
                        {selectedSale.is_invoiced ? (
                          <span className="badge bg-success">Facturada</span>
                        ) : (
                          <span className="badge bg-warning text-dark">Sin facturar</span>
                        )}
                      </p>
                      {selectedSale.customer_id && (
                        <p className="mb-1">
                          <strong>Cliente:</strong>{" "}
                          <i className="bi bi-person-circle me-1"></i>
                          <span className="text-muted">Cliente #{selectedSale.customer_id}</span>
                        </p>
                      )}
                      {selectedSale.payment_method && (
                        <p className="mb-1">
                          <strong>Medio de Pago:</strong>{" "}
                          <i className="bi bi-credit-card me-1"></i>
                          <span className="text-capitalize">{selectedSale.payment_method}</span>
                        </p>
                      )}
                      {selectedSale.cashier && (
                        <p className="mb-1">
                          <strong>Cajero:</strong>{" "}
                          <i className="bi bi-person-badge me-1"></i>
                          {selectedSale.cashier}
                        </p>
                      )}
                    </div>
                    <div className="col-md-6">
                      <p className="mb-1">
                        <strong>Total:</strong>{" "}
                        <span className="fs-4 text-primary">{formatARS(selectedSale.total_ars)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Delivery Information */}
                  {selectedSale.is_delivery && (
                    <>
                      <hr />
                      <div className="alert alert-info">
                        <h6 className="mb-2">
                          <i className="bi bi-truck me-2"></i>
                          Información de Delivery
                        </h6>
                        <p className="mb-2">
                          <strong>Dirección:</strong>{" "}
                          <i className="bi bi-geo-alt me-1"></i>
                          {selectedSale.delivery_address || "No especificada"}
                        </p>
                        <div className="row">
                          <div className="col-md-6">
                            <label className="form-label form-label-sm mb-1">
                              <strong>Cadete Asignado:</strong>
                            </label>
                            {selectedSale.delivery_person_id ? (
                              <div className="alert alert-success py-1 px-2 mb-0">
                                <i className="bi bi-person-check me-1"></i>
                                {deliveryPersons.find(dp => dp.id === selectedSale.delivery_person_id)?.name || `Cadete #${selectedSale.delivery_person_id}`}
                              </div>
                            ) : (
                              <select
                                className="form-select form-select-sm"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    assignDeliveryPerson(selectedSale.id, Number(e.target.value))
                                  }
                                }}
                                disabled={assigningDelivery}
                                defaultValue=""
                              >
                                <option value="">Seleccionar cadete...</option>
                                {deliveryPersons.map((dp) => (
                                  <option key={dp.id} value={dp.id}>
                                    {dp.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <hr />

                  <h6 className="mb-3">Items de la venta</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Producto</th>
                          <th className="text-center">Cantidad</th>
                          <th className="text-end">Precio Unit.</th>
                          <th className="text-end">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSale.items.map((item, idx) => {
                          const product = products.find((p) => p.id === item.product_id)
                          return (
                            <tr key={idx}>
                              <td>
                                {product ? (
                                  <>
                                    {product.name}
                                    {product.variant && (
                                      <small className="text-muted"> - {product.variant}</small>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-muted">Producto #{item.product_id}</span>
                                )}
                              </td>
                              <td className="text-center">
                                <span className="badge bg-secondary">{item.qty}</span>
                              </td>
                              <td className="text-end">{formatARS(item.unit_price_ars)}</td>
                              <td className="text-end">
                                <strong>{formatARS(item.line_total_ars)}</strong>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="table-light">
                        <tr>
                          <td colSpan={3} className="text-end">
                            <strong>Total:</strong>
                          </td>
                          <td className="text-end">
                            <strong className="fs-5 text-primary">{formatARS(selectedSale.total_ars)}</strong>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
