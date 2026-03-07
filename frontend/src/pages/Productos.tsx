import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { listProducts } from "@/lib/products"
import type { Product } from "@/types/product"

type NewProductForm = {
  category: string
  subcategory: string
  name: string
  variant: string
  price_ars: string
  stock_qty: string
  description: string
  is_active: boolean
}

function formatARS(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value)
}

export default function Productos() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")

  const [form, setForm] = useState<NewProductForm>({
    category: "",
    subcategory: "",
    name: "",
    variant: "",
    price_ars: "",
    stock_qty: "0",
    description: "",
    is_active: true,
  })

  useEffect(() => {
    setLoading(true)
    listProducts()
      .then((data) => setProducts(data))
      .catch(() => toast.error("No se pudieron cargar los productos"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return products

    return products.filter((p) => {
      const haystack =
        `${p.name} ${p.variant ?? ""} ${p.category} ${p.subcategory ?? ""}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [products, q])

  const stats = useMemo(() => {
    const active = filtered.filter(p => p.is_active).length
    const inactive = filtered.filter(p => !p.is_active).length
    const categories = new Set(filtered.map(p => p.category)).size

    return { active, inactive, categories, total: filtered.length }
  }, [filtered])

  const canSave = useMemo(() => {
    const priceOk = Number(form.price_ars) > 0
    return form.name.trim().length >= 3 && form.category.trim().length >= 2 && priceOk
  }, [form])

  function resetForm() {
    setForm({
      category: "",
      subcategory: "",
      name: "",
      variant: "",
      price_ars: "",
      stock_qty: "0",
      description: "",
      is_active: true,
    })
  }

  function handleCreate() {
    if (!canSave) return

    const nextId = products.length ? Math.max(...products.map((p) => p.id)) + 1 : 1

    const newProduct: Product = {
      id: nextId,
      category: form.category.trim(),
      subcategory: form.subcategory.trim() || null,
      name: form.name.trim(),
      variant: form.variant.trim() || null,
      price_ars: Number(form.price_ars),
      stock_qty: Number(form.stock_qty),
      description: form.description.trim() || null,
      is_active: form.is_active,
    }

    setProducts((prev) => [newProduct, ...prev])
    toast.success("Producto creado exitosamente", {
      description: `${newProduct.name} - ${formatARS(newProduct.price_ars)}`
    })

    // Close modal
    const modal = document.getElementById('createModal')
    if (modal) {
      const bsModal = (window as any).bootstrap.Modal.getInstance(modal)
      bsModal?.hide()
    }

    resetForm()
  }

  function handleDelete(id: number) {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return

    setProducts(prev => prev.filter(p => p.id !== id))
    toast.success("Producto eliminado")
  }

  function toggleActive(id: number) {
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, is_active: !p.is_active } : p
    ))
  }

  return (
    <div>
      {/* Header - Horizontal */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-0">
            <i className="bi bi-box-seam me-2"></i>
            Gestión de Productos
          </h3>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <span className="badge bg-secondary">{stats.total} total</span>
          <span className="badge bg-success">{stats.active} activos</span>
          <span className="badge bg-danger">{stats.inactive} inactivos</span>
          <span className="badge bg-info">{stats.categories} categorías</span>
          <button
            className="btn btn-primary btn-sm"
            data-bs-toggle="modal"
            data-bs-target="#createModal"
          >
            <i className="bi bi-plus-lg me-1"></i>
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Search - Horizontal */}
      <div className="row mb-3">
        <div className="col-md-6">
          <div className="input-group input-group-sm">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre, categoría, subcategoría o variante..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button
                className="btn btn-outline-secondary"
                onClick={() => setQ("")}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="card-body p-0">
          <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            <table className="table table-hover table-sm mb-0">
              <thead className="table-light sticky-top">
                <tr>
                  <th style={{ width: "30%" }}>Producto</th>
                  <th style={{ width: "15%" }}>Categoría</th>
                  <th style={{ width: "15%" }}>Subcategoría</th>
                  <th style={{ width: "10%" }} className="text-end">Precio</th>
                  <th style={{ width: "10%" }} className="text-center">Estado</th>
                  <th style={{ width: "20%" }} className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                      Cargando productos...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                      {q ? "No se encontraron productos" : "No hay productos"}
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="fw-semibold">{p.name}</div>
                        {p.variant && (
                          <small className="text-muted">
                            <i className="bi bi-tag-fill me-1"></i>
                            {p.variant}
                          </small>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-secondary">{p.category}</span>
                      </td>
                      <td>
                        <small className="text-muted">
                          {p.subcategory || "—"}
                        </small>
                      </td>
                      <td className="text-end fw-bold text-primary">
                        {formatARS(p.price_ars)}
                      </td>
                      <td className="text-center">
                        {p.is_active ? (
                          <span className="badge bg-success">
                            <i className="bi bi-check-circle me-1"></i>
                            Activo
                          </span>
                        ) : (
                          <span className="badge bg-danger">
                            <i className="bi bi-x-circle me-1"></i>
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className={`btn ${p.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => toggleActive(p.id)}
                            title={p.is_active ? 'Desactivar' : 'Activar'}
                          >
                            <i className={`bi ${p.is_active ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                          </button>
                          <button
                            className="btn btn-outline-primary"
                            title="Editar"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDelete(p.id)}
                            title="Eliminar"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Product Modal */}
      <div
        className="modal fade"
        id="createModal"
        tabIndex={-1}
        data-bs-backdrop="static"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-plus-circle me-2"></i>
                Crear Nuevo Producto
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                onClick={resetForm}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label">
                    <i className="bi bi-box-seam me-1"></i>
                    Nombre del Producto <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: Empanada de Carne"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Variante</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: Docena"
                    value={form.variant}
                    onChange={(e) => setForm((p) => ({ ...p, variant: e.target.value }))}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    <i className="bi bi-tag me-1"></i>
                    Categoría <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: Empanadas"
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Subcategoría</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: Clásicas"
                    value={form.subcategory}
                    onChange={(e) => setForm((p) => ({ ...p, subcategory: e.target.value }))}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    <i className="bi bi-currency-dollar me-1"></i>
                    Precio (ARS) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="2500"
                    value={form.price_ars}
                    onChange={(e) => setForm((p) => ({ ...p, price_ars: e.target.value }))}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    <i className="bi bi-box-seam-fill me-1"></i>
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0"
                    min="0"
                    value={form.stock_qty}
                    onChange={(e) => setForm((p) => ({ ...p, stock_qty: e.target.value }))}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Estado</label>
                  <div className="form-check form-switch mt-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="activeSwitch"
                      checked={form.is_active}
                      onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                    />
                    <label className="form-check-label" htmlFor="activeSwitch">
                      {form.is_active ? (
                        <span className="badge bg-success">Activo</span>
                      ) : (
                        <span className="badge bg-secondary">Inactivo</span>
                      )}
                    </label>
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Ingredientes, características o notas especiales"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={resetForm}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={!canSave}
              >
                <i className="bi bi-plus-lg me-1"></i>
                Crear Producto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
