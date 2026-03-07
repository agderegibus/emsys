import { useEffect, useState } from "react"
import { toast } from "sonner"
import { apiGet } from "@/lib/api"
import { useBranch } from "@/contexts/BranchContext"
import type { Product } from "@/types/product"

type Sale = {
  id: number
  created_at: string
  customer_id: number | null
  is_invoiced: boolean
  total_ars: number
  items: Array<{
    product_id: number
    qty: number
    unit_price_ars: number
    line_total_ars: number
  }>
}

type AnalyticsSummary = {
  period: {
    start: string
    end: string
    days: number
  }
  metrics: {
    total_sales: number
    total_transactions: number
    avg_ticket: number
    sales_growth: number
    transactions_growth: number
    avg_ticket_growth: number
  }
  previous_period: {
    total_sales: number
    total_transactions: number
    avg_ticket: number
  }
  top_products_by_quantity: Array<{
    id: number
    name: string
    variant: string | null
    category: string
    total_qty: number
    total_revenue: number
  }>
  top_products_by_revenue: Array<{
    id: number
    name: string
    variant: string | null
    category: string
    total_qty: number
    total_revenue: number
  }>
  sales_by_category: Array<{
    category: string
    total_qty: number
    total_revenue: number
  }>
  hourly_data: Array<{
    hour: number
    transactions: number
    total: number
  }>
  daily_data: Array<{
    date: string
    transactions: number
    total: number
  }>
}

type SupplierStats = {
  supplier_id: number
  supplier_name: string
  total_purchases: number
  total_spent: number
}

type CashierStats = {
  cashier: string
  total_sales: number
  total_amount: number
  payment_methods: {
    efectivo: number
    tarjeta: number
    mercadopago: number
  }
}

function formatARS(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number) {
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}

export default function Analytics() {
  const { currentBranch } = useBranch()
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<"today" | "yesterday" | "7days" | "30days" | "custom">("today")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")

  // Supplier and cashier stats
  const [supplierStats, setSupplierStats] = useState<SupplierStats[]>([])
  const [cashierStats, setCashierStats] = useState<CashierStats[]>([])

  // Modal states
  const [showSalesModal, setShowSalesModal] = useState(false)
  const [modalTitle, setModalTitle] = useState("")
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [loadingSales, setLoadingSales] = useState(false)
  const [products, setProducts] = useState<Product[]>([])

  // Reload data when branch or date range changes
  useEffect(() => {
    loadData()
    loadSupplierStats()
    loadCashierStats()
  }, [dateRange, customStart, customEnd, currentBranch?.id])

  useEffect(() => {
    loadProducts()
  }, [currentBranch?.id])

  async function loadData() {
    setLoading(true)
    try {
      let startDate = ""
      let endDate = ""

      const now = new Date()
      const today = now.toISOString().split("T")[0]

      switch (dateRange) {
        case "today":
          startDate = today
          endDate = today
          break
        case "yesterday":
          const yesterday = new Date(now)
          yesterday.setDate(yesterday.getDate() - 1)
          startDate = yesterday.toISOString().split("T")[0]
          endDate = startDate
          break
        case "7days":
          const sevenDaysAgo = new Date(now)
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
          startDate = sevenDaysAgo.toISOString().split("T")[0]
          endDate = today
          break
        case "30days":
          const thirtyDaysAgo = new Date(now)
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
          startDate = thirtyDaysAgo.toISOString().split("T")[0]
          endDate = today
          break
        case "custom":
          startDate = customStart
          endDate = customEnd
          break
      }

      const params = new URLSearchParams()
      if (startDate) params.append("start_date", startDate)
      if (endDate) params.append("end_date", endDate)

      const result = await apiGet<AnalyticsSummary>(`/analytics/summary?${params.toString()}`)
      setData(result)
    } catch (error) {
      toast.error("Error al cargar datos de análisis")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function loadProducts() {
    try {
      const result = await apiGet<Product[]>("/products")
      setProducts(result)
    } catch (error) {
      console.error("Error loading products:", error)
    }
  }

  async function loadSupplierStats() {
    try {
      let startDate = ""
      let endDate = ""

      const now = new Date()
      const today = now.toISOString().split("T")[0]

      switch (dateRange) {
        case "today":
          startDate = today
          endDate = today
          break
        case "yesterday":
          const yesterday = new Date(now)
          yesterday.setDate(yesterday.getDate() - 1)
          startDate = yesterday.toISOString().split("T")[0]
          endDate = startDate
          break
        case "7days":
          const sevenDaysAgo = new Date(now)
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
          startDate = sevenDaysAgo.toISOString().split("T")[0]
          endDate = today
          break
        case "30days":
          const thirtyDaysAgo = new Date(now)
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
          startDate = thirtyDaysAgo.toISOString().split("T")[0]
          endDate = today
          break
        case "custom":
          startDate = customStart
          endDate = customEnd
          break
      }

      const params = new URLSearchParams()
      if (startDate) params.append("start_date", startDate)
      if (endDate) params.append("end_date", endDate)

      const result = await apiGet<SupplierStats[]>(`/analytics/suppliers?${params.toString()}`)
      setSupplierStats(result)
    } catch (error) {
      console.error("Error loading supplier stats:", error)
    }
  }

  async function loadCashierStats() {
    try {
      let startDate = ""
      let endDate = ""

      const now = new Date()
      const today = now.toISOString().split("T")[0]

      switch (dateRange) {
        case "today":
          startDate = today
          endDate = today
          break
        case "yesterday":
          const yesterday = new Date(now)
          yesterday.setDate(yesterday.getDate() - 1)
          startDate = yesterday.toISOString().split("T")[0]
          endDate = startDate
          break
        case "7days":
          const sevenDaysAgo = new Date(now)
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
          startDate = sevenDaysAgo.toISOString().split("T")[0]
          endDate = today
          break
        case "30days":
          const thirtyDaysAgo = new Date(now)
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
          startDate = thirtyDaysAgo.toISOString().split("T")[0]
          endDate = today
          break
        case "custom":
          startDate = customStart
          endDate = customEnd
          break
      }

      const params = new URLSearchParams()
      if (startDate) params.append("start_date", startDate)
      if (endDate) params.append("end_date", endDate)

      const result = await apiGet<CashierStats[]>(`/analytics/cashiers?${params.toString()}`)
      setCashierStats(result)
    } catch (error) {
      console.error("Error loading cashier stats:", error)
    }
  }

  async function loadFilteredSales(filters: {
    hour?: number
    category?: string
    product_id?: number
    date?: string
  }) {
    setLoadingSales(true)
    setShowSalesModal(true)

    try {
      const params = new URLSearchParams()

      // Add date range from current selection
      if (dateRange === "today" || dateRange === "yesterday") {
        const now = new Date()
        if (dateRange === "yesterday") {
          now.setDate(now.getDate() - 1)
        }
        params.append("date", now.toISOString().split("T")[0])
      } else if (dateRange === "custom" && customStart && customEnd) {
        params.append("start_date", customStart)
        params.append("end_date", customEnd)
      } else if (dateRange === "7days") {
        const now = new Date()
        const sevenDaysAgo = new Date(now)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
        params.append("start_date", sevenDaysAgo.toISOString().split("T")[0])
        params.append("end_date", now.toISOString().split("T")[0])
      } else if (dateRange === "30days") {
        const now = new Date()
        const thirtyDaysAgo = new Date(now)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
        params.append("start_date", thirtyDaysAgo.toISOString().split("T")[0])
        params.append("end_date", now.toISOString().split("T")[0])
      }

      // Add specific filters
      if (filters.hour !== undefined) params.append("hour", filters.hour.toString())
      if (filters.category) params.append("category", filters.category)
      if (filters.product_id) params.append("product_id", filters.product_id.toString())
      if (filters.date) params.append("date", filters.date)

      const result = await apiGet<Sale[]>(`/analytics/sales?${params.toString()}`)
      setFilteredSales(result)
    } catch (error) {
      toast.error("Error al cargar transacciones")
      console.error(error)
    } finally {
      setLoadingSales(false)
    }
  }

  function openSalesModal(title: string, filters: Parameters<typeof loadFilteredSales>[0]) {
    setModalTitle(title)
    loadFilteredSales(filters)
  }

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning">No hay datos disponibles</div>
      </div>
    )
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <i className="bi bi-graph-up me-2"></i>
          Analytics
        </h2>

        {/* Date range selector */}
        <div className="d-flex gap-2">
          <button
            className={`btn btn-sm ${dateRange === "today" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setDateRange("today")}
          >
            Hoy
          </button>
          <button
            className={`btn btn-sm ${dateRange === "yesterday" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setDateRange("yesterday")}
          >
            Ayer
          </button>
          <button
            className={`btn btn-sm ${dateRange === "7days" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setDateRange("7days")}
          >
            7 días
          </button>
          <button
            className={`btn btn-sm ${dateRange === "30days" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setDateRange("30days")}
          >
            30 días
          </button>
          <button
            className={`btn btn-sm ${dateRange === "custom" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setDateRange("custom")}
          >
            Personalizado
          </button>
        </div>
      </div>

      {/* Custom date range */}
      {dateRange === "custom" && (
        <div className="row mb-3">
          <div className="col-md-3">
            <label className="form-label">Desde</label>
            <input
              type="date"
              className="form-control"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Hasta</label>
            <input
              type="date"
              className="form-control"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
          <div className="col-md-2 d-flex align-items-end">
            <button className="btn btn-primary" onClick={loadData}>
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* Period info */}
      <div className="alert alert-info mb-4">
        <i className="bi bi-calendar-range me-2"></i>
        Mostrando datos del{" "}
        <strong>{new Date(data.period.start).toLocaleDateString("es-AR")}</strong> al{" "}
        <strong>{new Date(data.period.end).toLocaleDateString("es-AR")}</strong>
        {" "}({data.period.days} {data.period.days === 1 ? "día" : "días"})
      </div>

      {/* Key Metrics Cards */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card h-100 border-primary">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1">Ventas Totales</p>
                  <h3 className="mb-0">{formatARS(data.metrics.total_sales)}</h3>
                  <small
                    className={
                      data.metrics.sales_growth >= 0 ? "text-success" : "text-danger"
                    }
                  >
                    <i
                      className={`bi bi-arrow-${data.metrics.sales_growth >= 0 ? "up" : "down"} me-1`}
                    ></i>
                    {formatPercent(data.metrics.sales_growth)} vs período anterior
                  </small>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <i className="bi bi-currency-dollar fs-3 text-primary"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100 border-success">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1">Transacciones</p>
                  <h3 className="mb-0">{data.metrics.total_transactions}</h3>
                  <small
                    className={
                      data.metrics.transactions_growth >= 0 ? "text-success" : "text-danger"
                    }
                  >
                    <i
                      className={`bi bi-arrow-${data.metrics.transactions_growth >= 0 ? "up" : "down"} me-1`}
                    ></i>
                    {formatPercent(data.metrics.transactions_growth)} vs período anterior
                  </small>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <i className="bi bi-receipt fs-3 text-success"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100 border-warning">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1">Ticket Promedio</p>
                  <h3 className="mb-0">{formatARS(data.metrics.avg_ticket)}</h3>
                  <small
                    className={
                      data.metrics.avg_ticket_growth >= 0 ? "text-success" : "text-danger"
                    }
                  >
                    <i
                      className={`bi bi-arrow-${data.metrics.avg_ticket_growth >= 0 ? "up" : "down"} me-1`}
                    ></i>
                    {formatPercent(data.metrics.avg_ticket_growth)} vs período anterior
                  </small>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <i className="bi bi-basket fs-3 text-warning"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row mb-4">
        {/* Hourly sales */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header bg-primary bg-opacity-10">
              <h5 className="mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Ventas por Hora
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive" style={{ maxHeight: "400px" }}>
                <table className="table table-sm table-hover">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th>Hora</th>
                      <th className="text-end">Transacciones</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.hourly_data
                      .filter((h) => h.transactions > 0)
                      .map((h) => (
                        <tr
                          key={h.hour}
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            openSalesModal(
                              `Ventas de ${h.hour.toString().padStart(2, "0")}:00 a ${h.hour.toString().padStart(2, "0")}:59`,
                              { hour: h.hour }
                            )
                          }
                        >
                          <td>
                            {h.hour.toString().padStart(2, "0")}:00 - {h.hour.toString().padStart(2, "0")}:59
                          </td>
                          <td className="text-end">
                            <span className="badge bg-secondary">{h.transactions}</span>
                          </td>
                          <td className="text-end">{formatARS(h.total)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Sales by category */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header bg-success bg-opacity-10">
              <h5 className="mb-0">
                <i className="bi bi-pie-chart me-2"></i>
                Ventas por Categoría
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive" style={{ maxHeight: "400px" }}>
                <table className="table table-sm table-hover">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th>Categoría</th>
                      <th className="text-end">Cantidad</th>
                      <th className="text-end">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sales_by_category.map((c) => (
                      <tr
                        key={c.category}
                        style={{ cursor: "pointer" }}
                        onClick={() => openSalesModal(`Ventas de ${c.category}`, { category: c.category })}
                      >
                        <td>{c.category}</td>
                        <td className="text-end">
                          <span className="badge bg-secondary">{c.total_qty}</span>
                        </td>
                        <td className="text-end">
                          <strong>{formatARS(c.total_revenue)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily trend (only show if multiple days) */}
      {data.daily_data.length > 1 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-info bg-opacity-10">
                <h5 className="mb-0">
                  <i className="bi bi-graph-up me-2"></i>
                  Tendencia Diaria
                </h5>
              </div>
              <div className="card-body">
                <div className="table-responsive" style={{ maxHeight: "400px" }}>
                  <table className="table table-sm table-hover">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>Fecha</th>
                        <th className="text-end">Transacciones</th>
                        <th className="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.daily_data.map((d) => (
                        <tr
                          key={d.date}
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            openSalesModal(`Ventas del ${new Date(d.date).toLocaleDateString("es-AR")}`, {
                              date: d.date,
                            })
                          }
                        >
                          <td>{new Date(d.date).toLocaleDateString("es-AR")}</td>
                          <td className="text-end">
                            <span className="badge bg-secondary">{d.transactions}</span>
                          </td>
                          <td className="text-end">
                            <strong>{formatARS(d.total)}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Products */}
      <div className="row mb-4">
        {/* Top by quantity */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header bg-warning bg-opacity-10">
              <h5 className="mb-0">
                <i className="bi bi-trophy me-2"></i>
                Top Productos por Cantidad
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive" style={{ maxHeight: "400px" }}>
                <table className="table table-sm table-hover">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th>#</th>
                      <th>Producto</th>
                      <th className="text-end">Vendidos</th>
                      <th className="text-end">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_products_by_quantity.map((p, idx) => (
                      <tr
                        key={p.id}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          openSalesModal(`Ventas de ${p.name}${p.variant ? ` - ${p.variant}` : ""}`, {
                            product_id: p.id,
                          })
                        }
                      >
                        <td>
                          <span className="badge bg-primary">{idx + 1}</span>
                        </td>
                        <td>
                          {p.name}
                          {p.variant && (
                            <small className="text-muted"> - {p.variant}</small>
                          )}
                          <br />
                          <small className="text-muted">{p.category}</small>
                        </td>
                        <td className="text-end">
                          <span className="badge bg-secondary">{p.total_qty}</span>
                        </td>
                        <td className="text-end">{formatARS(p.total_revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Top by revenue */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header bg-danger bg-opacity-10">
              <h5 className="mb-0">
                <i className="bi bi-currency-exchange me-2"></i>
                Top Productos por Revenue
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive" style={{ maxHeight: "400px" }}>
                <table className="table table-sm table-hover">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th>#</th>
                      <th>Producto</th>
                      <th className="text-end">Vendidos</th>
                      <th className="text-end">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_products_by_revenue.map((p, idx) => (
                      <tr
                        key={p.id}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          openSalesModal(`Ventas de ${p.name}${p.variant ? ` - ${p.variant}` : ""}`, {
                            product_id: p.id,
                          })
                        }
                      >
                        <td>
                          <span className="badge bg-danger">{idx + 1}</span>
                        </td>
                        <td>
                          {p.name}
                          {p.variant && (
                            <small className="text-muted"> - {p.variant}</small>
                          )}
                          <br />
                          <small className="text-muted">{p.category}</small>
                        </td>
                        <td className="text-end">
                          <span className="badge bg-secondary">{p.total_qty}</span>
                        </td>
                        <td className="text-end">
                          <strong>{formatARS(p.total_revenue)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supplier and Cashier Statistics */}
      <div className="row mb-4">
        {/* Supplier Stats */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header bg-secondary bg-opacity-10">
              <h5 className="mb-0">
                <i className="bi bi-building me-2"></i>
                Compras por Proveedor
              </h5>
            </div>
            <div className="card-body">
              {supplierStats.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                  <p>No hay compras registradas</p>
                </div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: "400px" }}>
                  <table className="table table-sm table-hover">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>Proveedor</th>
                        <th className="text-end">Compras</th>
                        <th className="text-end">Total Gastado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierStats.map((s) => (
                        <tr key={s.supplier_id}>
                          <td>
                            <i className="bi bi-building me-1 text-muted"></i>
                            {s.supplier_name}
                          </td>
                          <td className="text-end">
                            <span className="badge bg-secondary">{s.total_purchases}</span>
                          </td>
                          <td className="text-end">
                            <strong>{formatARS(s.total_spent)}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="table-light">
                      <tr>
                        <td><strong>Total</strong></td>
                        <td className="text-end">
                          <span className="badge bg-dark">
                            {supplierStats.reduce((sum, s) => sum + s.total_purchases, 0)}
                          </span>
                        </td>
                        <td className="text-end">
                          <strong className="text-success">
                            {formatARS(supplierStats.reduce((sum, s) => sum + s.total_spent, 0))}
                          </strong>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cashier Stats */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header bg-info bg-opacity-10">
              <h5 className="mb-0">
                <i className="bi bi-person-badge me-2"></i>
                Ventas por Cajero
              </h5>
            </div>
            <div className="card-body">
              {cashierStats.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                  <p>No hay ventas con cajero registrado</p>
                </div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: "400px" }}>
                  <table className="table table-sm table-hover">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>Cajero</th>
                        <th className="text-end">Ventas</th>
                        <th className="text-end">Total</th>
                        <th className="text-center">Medios de Pago</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashierStats.map((c, idx) => (
                        <tr key={idx}>
                          <td>
                            <i className="bi bi-person-circle me-1 text-muted"></i>
                            {c.cashier}
                          </td>
                          <td className="text-end">
                            <span className="badge bg-secondary">{c.total_sales}</span>
                          </td>
                          <td className="text-end">
                            <strong>{formatARS(c.total_amount)}</strong>
                          </td>
                          <td className="text-center">
                            <div className="d-flex gap-1 justify-content-center flex-wrap">
                              {c.payment_methods.efectivo > 0 && (
                                <span className="badge bg-success" title="Efectivo">
                                  💵 {formatARS(c.payment_methods.efectivo)}
                                </span>
                              )}
                              {c.payment_methods.tarjeta > 0 && (
                                <span className="badge bg-primary" title="Tarjeta">
                                  💳 {formatARS(c.payment_methods.tarjeta)}
                                </span>
                              )}
                              {c.payment_methods.mercadopago > 0 && (
                                <span className="badge bg-info" title="MercadoPago">
                                  📱 {formatARS(c.payment_methods.mercadopago)}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="table-light">
                      <tr>
                        <td><strong>Total</strong></td>
                        <td className="text-end">
                          <span className="badge bg-dark">
                            {cashierStats.reduce((sum, c) => sum + c.total_sales, 0)}
                          </span>
                        </td>
                        <td className="text-end">
                          <strong className="text-success">
                            {formatARS(cashierStats.reduce((sum, c) => sum + c.total_amount, 0))}
                          </strong>
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Transacciones */}
      {showSalesModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-receipt-cutoff me-2"></i>
                  {modalTitle}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowSalesModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {loadingSales ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                  </div>
                ) : filteredSales.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                    <p>No hay transacciones para este filtro</p>
                  </div>
                ) : (
                  <>
                    <div className="alert alert-info mb-3">
                      <strong>{filteredSales.length}</strong> transacción
                      {filteredSales.length !== 1 ? "es" : ""} encontrada
                      {filteredSales.length !== 1 ? "s" : ""}
                      <span className="ms-3">
                        <strong>Total:</strong> {formatARS(filteredSales.reduce((sum, s) => sum + s.total_ars, 0))}
                      </span>
                    </div>

                    <div className="table-responsive" style={{ maxHeight: "500px" }}>
                      <table className="table table-sm table-hover">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th>Venta #</th>
                            <th>Fecha y Hora</th>
                            <th>Items</th>
                            <th>Productos</th>
                            <th className="text-end">Total</th>
                            <th className="text-center">Factura</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSales.map((sale) => (
                            <tr key={sale.id}>
                              <td>
                                <strong>#{sale.id}</strong>
                              </td>
                              <td>
                                <small>{new Date(sale.created_at).toLocaleString("es-AR")}</small>
                              </td>
                              <td>
                                <span className="badge bg-secondary">{sale.items.length}</span>
                              </td>
                              <td>
                                <small>
                                  {sale.items.map((item, idx) => {
                                    const product = products.find((p) => p.id === item.product_id)
                                    return (
                                      <div key={idx}>
                                        {item.qty}x {product?.name || `Producto #${item.product_id}`}
                                        {product?.variant && ` (${product.variant})`}
                                      </div>
                                    )
                                  })}
                                </small>
                              </td>
                              <td className="text-end">
                                <strong>{formatARS(sale.total_ars)}</strong>
                              </td>
                              <td className="text-center">
                                {sale.is_invoiced ? (
                                  <span className="badge bg-success">Sí</span>
                                ) : (
                                  <span className="badge bg-warning text-dark">No</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSalesModal(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
