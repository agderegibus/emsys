import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { apiGet } from "@/lib/api"
import { listProducts } from "@/lib/products"
import { createStockMovement, listStockMovements, getStockLevels, getRepositionNeeds } from "@/lib/stock"
import { useBranch } from "@/contexts/BranchContext"
import type { Product } from "@/types/product"
import type { StockMovement, ProductStock, ProductReposition } from "@/types/stock"

type Supplier = {
  id: number
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
}

function formatARS(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date))
}

export default function Stock() {
  const { currentBranch } = useBranch()
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [productStocks, setProductStocks] = useState<ProductStock[]>([])
  const [repositionNeeds, setRepositionNeeds] = useState<ProductReposition[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"levels" | "movements" | "manage" | "reposition">("levels")

  // Form state for stock movements
  const [form, setForm] = useState({
    product_id: "",
    movement_type: "entrada" as "entrada" | "salida" | "ajuste",
    quantity: "",
    reason: "",
    supplier_id: "",
    purchase_price_ars: "",
  })

  // Reload data when branch changes
  useEffect(() => {
    loadData()
  }, [currentBranch?.id])

  async function loadData() {
    setLoading(true)
    try {
      const [productsData, suppliersData, stockLevels, movementsData, repositionData] = await Promise.all([
        listProducts(),
        apiGet<Supplier[]>("/suppliers"),
        getStockLevels(),
        listStockMovements({ limit: 100 }),
        getRepositionNeeds()
      ])
      setProducts(productsData)
      setSuppliers(suppliersData)
      setProductStocks(stockLevels)
      setMovements(movementsData)
      setRepositionNeeds(repositionData)
    } catch (error) {
      toast.error("No se pudieron cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const lowStock = productStocks.filter((ps) => ps.current_stock <= (ps.min_stock ?? 0)).length
    const totalProducts = productStocks.length
    const recentMovements = movements.filter((m) => {
      const date = new Date(m.created_at)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return date > dayAgo
    }).length

    return { lowStock, totalProducts, recentMovements }
  }, [productStocks, movements])

  const canSave = useMemo(() => {
    return (
      form.product_id &&
      Number(form.quantity) > 0 &&
      form.movement_type
    )
  }, [form])

  function resetForm() {
    setForm({
      product_id: "",
      movement_type: "entrada",
      quantity: "",
      reason: "",
      supplier_id: "",
      purchase_price_ars: "",
    })
  }

  async function handleSubmit() {
    if (!canSave) return

    const product = products.find((p) => p.id === Number(form.product_id))
    if (!product) return

    try {
      await createStockMovement({
        product_id: Number(form.product_id),
        movement_type: form.movement_type,
        quantity: Number(form.quantity),
        reason: form.reason.trim() || undefined,
        user_id: undefined, // TODO: get from auth
        supplier_id: form.supplier_id ? Number(form.supplier_id) : undefined,
        purchase_price_ars: form.purchase_price_ars ? Number(form.purchase_price_ars) : undefined,
      })

      toast.success("Movimiento de stock registrado", {
        description: `${product.name} - ${form.movement_type.toUpperCase()}: ${form.quantity} unidades`,
      })

      resetForm()
      loadData() // Reload all data to reflect changes
    } catch (error: any) {
      toast.error(error?.message || "Error al registrar movimiento")
    }
  }

  return (
    <div>
      {/* Header - Horizontal */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-0">
            <i className="bi bi-box-seam-fill me-2"></i>
            Gestión de Stock
          </h3>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <span className="badge bg-secondary">{stats.totalProducts} productos</span>
          <span className={`badge ${stats.lowStock > 0 ? 'bg-danger' : 'bg-success'}`}>
            <i className="bi bi-exclamation-triangle me-1"></i>
            {stats.lowStock} stock bajo
          </span>
          <span className="badge bg-info">
            <i className="bi bi-clock-history me-1"></i>
            {stats.recentMovements} mov. hoy
          </span>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "levels" ? "active" : ""}`}
            onClick={() => setActiveTab("levels")}
          >
            <i className="bi bi-graph-up me-1"></i>
            Niveles de Stock
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "movements" ? "active" : ""}`}
            onClick={() => setActiveTab("movements")}
          >
            <i className="bi bi-arrow-left-right me-1"></i>
            Movimientos
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "reposition" ? "active" : ""}`}
            onClick={() => setActiveTab("reposition")}
          >
            <i className="bi bi-cart-plus me-1"></i>
            Reposición
            {repositionNeeds.length > 0 && (
              <span className="badge bg-danger ms-2">{repositionNeeds.length}</span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "manage" ? "active" : ""}`}
            onClick={() => setActiveTab("manage")}
          >
            <i className="bi bi-pencil-square me-1"></i>
            Cargar/Dar de Baja
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      {activeTab === "levels" && (
        <div className="card">
          <div className="card-body p-0">
            <div style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
              <table className="table table-hover table-sm mb-0">
                <thead className="table-light sticky-top">
                  <tr>
                    <th style={{ width: "35%" }}>Producto</th>
                    <th style={{ width: "20%" }}>Categoría</th>
                    <th style={{ width: "15%" }} className="text-center">
                      Stock Actual
                    </th>
                    <th style={{ width: "15%" }} className="text-center">
                      Stock Mínimo
                    </th>
                    <th style={{ width: "15%" }} className="text-center">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5">
                        <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                        Cargando stock...
                      </td>
                    </tr>
                  ) : productStocks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5 text-muted">
                        <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                        No hay productos
                      </td>
                    </tr>
                  ) : (
                    productStocks.map((ps) => (
                      <tr key={ps.product_id}>
                        <td>
                          <div className="fw-semibold">{ps.product_name}</div>
                          {ps.variant && (
                            <small className="text-muted">
                              <i className="bi bi-tag-fill me-1"></i>
                              {ps.variant}
                            </small>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-secondary">{ps.category}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-dark fs-6">{ps.current_stock}</span>
                        </td>
                        <td className="text-center text-muted">{ps.min_stock ?? "—"}</td>
                        <td className="text-center">
                          {ps.current_stock <= (ps.min_stock ?? 0) ? (
                            <span className="badge bg-danger">
                              <i className="bi bi-exclamation-triangle me-1"></i>
                              Bajo
                            </span>
                          ) : ps.current_stock <= (ps.min_stock ?? 0) * 2 ? (
                            <span className="badge bg-warning">
                              <i className="bi bi-exclamation-circle me-1"></i>
                              Medio
                            </span>
                          ) : (
                            <span className="badge bg-success">
                              <i className="bi bi-check-circle me-1"></i>
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "movements" && (
        <div className="card">
          <div className="card-body p-0">
            <div style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
              <table className="table table-hover table-sm mb-0">
                <thead className="table-light sticky-top">
                  <tr>
                    <th style={{ width: "12%" }}>Fecha</th>
                    <th style={{ width: "20%" }}>Producto</th>
                    <th style={{ width: "10%" }} className="text-center">
                      Tipo
                    </th>
                    <th style={{ width: "8%" }} className="text-center">
                      Cant.
                    </th>
                    <th style={{ width: "8%" }} className="text-center">
                      Ant.
                    </th>
                    <th style={{ width: "8%" }} className="text-center">
                      Nuevo
                    </th>
                    <th style={{ width: "12%" }}>Proveedor</th>
                    <th style={{ width: "10%" }} className="text-end">
                      Precio
                    </th>
                    <th style={{ width: "12%" }}>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-5 text-muted">
                        <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                        No hay movimientos registrados
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <small className="text-muted">{formatDateTime(m.created_at)}</small>
                        </td>
                        <td>
                          <div className="fw-semibold small">{m.product_name}</div>
                          <small className="text-muted">{m.product_category}</small>
                        </td>
                        <td className="text-center">
                          {m.movement_type === "entrada" ? (
                            <span className="badge bg-success">
                              <i className="bi bi-arrow-down-circle me-1"></i>
                              Entrada
                            </span>
                          ) : m.movement_type === "salida" ? (
                            <span className="badge bg-danger">
                              <i className="bi bi-arrow-up-circle me-1"></i>
                              Salida
                            </span>
                          ) : (
                            <span className="badge bg-warning">
                              <i className="bi bi-pencil me-1"></i>
                              Ajuste
                            </span>
                          )}
                        </td>
                        <td className="text-center fw-bold">{m.quantity}</td>
                        <td className="text-center text-muted">{m.previous_stock}</td>
                        <td className="text-center">
                          <span className="badge bg-dark">{m.new_stock}</span>
                        </td>
                        <td>
                          <small className="text-muted">
                            {m.supplier_name ? (
                              <>
                                <i className="bi bi-building me-1"></i>
                                {m.supplier_name}
                              </>
                            ) : (
                              "—"
                            )}
                          </small>
                        </td>
                        <td className="text-end">
                          <small>
                            {m.purchase_price_ars ? formatARS(m.purchase_price_ars) : "—"}
                          </small>
                        </td>
                        <td>
                          <small className="text-muted">{m.reason || "—"}</small>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "reposition" && (
        <div className="card">
          <div className="card-header bg-warning bg-opacity-10">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-cart-plus me-2"></i>
                Productos que Necesitan Reposición
              </h5>
              {repositionNeeds.length > 0 && (
                <span className="badge bg-danger fs-6">
                  {repositionNeeds.length} productos bajo stock mínimo
                </span>
              )}
            </div>
          </div>
          <div className="card-body p-0">
            <div style={{ maxHeight: "calc(100vh - 320px)", overflowY: "auto" }}>
              <table className="table table-hover table-sm mb-0">
                <thead className="table-light sticky-top">
                  <tr>
                    <th style={{ width: "30%" }}>Producto</th>
                    <th style={{ width: "15%" }}>Categoría</th>
                    <th style={{ width: "10%" }} className="text-center">
                      Stock Actual
                    </th>
                    <th style={{ width: "10%" }} className="text-center">
                      Stock Mínimo
                    </th>
                    <th style={{ width: "15%" }} className="text-center">
                      Unidades Necesarias
                    </th>
                    <th style={{ width: "20%" }}>Proveedor Sugerido</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5">
                        <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                        Cargando datos de reposición...
                      </td>
                    </tr>
                  ) : repositionNeeds.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5 text-muted">
                        <i className="bi bi-check-circle fs-1 d-block mb-2 text-success"></i>
                        <strong>¡Excelente!</strong>
                        <br />
                        Todos los productos tienen stock suficiente
                      </td>
                    </tr>
                  ) : (
                    repositionNeeds.map((item) => (
                      <tr key={item.product_id}>
                        <td>
                          <div className="fw-semibold">{item.product_name}</div>
                          {item.variant && (
                            <small className="text-muted">
                              <i className="bi bi-tag-fill me-1"></i>
                              {item.variant}
                            </small>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-secondary">{item.category}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-danger fs-6">{item.current_stock}</span>
                        </td>
                        <td className="text-center text-muted">{item.min_stock}</td>
                        <td className="text-center">
                          <span className="badge bg-warning text-dark fs-6">
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            {item.units_needed}
                          </span>
                        </td>
                        <td>
                          {item.suggested_supplier_name ? (
                            <small className="text-muted">
                              <i className="bi bi-building me-1"></i>
                              {item.suggested_supplier_name}
                            </small>
                          ) : (
                            <small className="text-muted fst-italic">Sin proveedor asignado</small>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {repositionNeeds.length > 0 && (
            <div className="card-footer">
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  Ordenado por urgencia (mayor necesidad primero)
                </small>
                <div className="d-flex gap-2">
                  <span className="badge bg-light text-dark">
                    Total unidades necesarias:{" "}
                    <strong>
                      {repositionNeeds.reduce((sum, item) => sum + item.units_needed, 0)}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "manage" && (
        <div className="row">
          <div className="col-md-6 mx-auto">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-pencil-square me-2"></i>
                  Registrar Movimiento de Stock
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">
                      Producto <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={form.product_id}
                      onChange={(e) => setForm((p) => ({ ...p, product_id: e.target.value }))}
                    >
                      <option value="">Seleccionar producto...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.variant ? `- ${p.variant}` : ""} ({p.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Tipo de Movimiento <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={form.movement_type}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          movement_type: e.target.value as "entrada" | "salida" | "ajuste",
                        }))
                      }
                    >
                      <option value="entrada">
                        📥 Entrada (Agregar stock)
                      </option>
                      <option value="salida">
                        📤 Salida (Dar de baja)
                      </option>
                      <option value="ajuste">
                        ✏️ Ajuste (Corrección)
                      </option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Cantidad <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0"
                      min="1"
                      value={form.quantity}
                      onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                    />
                  </div>

                  {form.movement_type === "entrada" && (
                    <>
                      <div className="col-md-6">
                        <label className="form-label">
                          <i className="bi bi-building me-1"></i>
                          Proveedor
                        </label>
                        <select
                          className="form-select"
                          value={form.supplier_id}
                          onChange={(e) => setForm((p) => ({ ...p, supplier_id: e.target.value }))}
                        >
                          <option value="">Seleccionar proveedor...</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">
                          <i className="bi bi-cash me-1"></i>
                          Precio de Compra (ARS)
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="0"
                          min="0"
                          value={form.purchase_price_ars}
                          onChange={(e) => setForm((p) => ({ ...p, purchase_price_ars: e.target.value }))}
                        />
                        {form.purchase_price_ars && form.quantity && (
                          <small className="text-muted">
                            Total: {formatARS(Number(form.purchase_price_ars) * Number(form.quantity))}
                          </small>
                        )}
                      </div>
                    </>
                  )}

                  <div className="col-12">
                    <label className="form-label">Motivo / Observaciones</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Ej: Compra a proveedor, producto vencido, corrección de inventario..."
                      value={form.reason}
                      onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                    ></textarea>
                  </div>

                  {form.product_id && (
                    <div className="col-12">
                      <div className="alert alert-info mb-0">
                        <i className="bi bi-info-circle me-2"></i>
                        <strong>Stock actual:</strong>{" "}
                        {productStocks.find((ps) => ps.product_id === Number(form.product_id))
                          ?.current_stock ?? 0}{" "}
                        unidades
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="card-footer">
                <div className="d-flex gap-2 justify-content-end">
                  <button className="btn btn-secondary" onClick={resetForm}>
                    <i className="bi bi-x-lg me-1"></i>
                    Limpiar
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={!canSave}
                  >
                    <i className="bi bi-check-lg me-1"></i>
                    Registrar Movimiento
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
