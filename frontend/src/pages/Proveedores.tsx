import { useEffect, useState } from "react"
import { toast } from "sonner"
import { apiGet, apiPost } from "@/lib/api"

type Supplier = {
  id: number
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  created_at: string
}

type SupplierWithStats = Supplier & {
  total_purchases: number
  total_spent: number
  last_purchase_date: string | null
}

type SupplierPurchase = {
  id: number
  created_at: string
  product_id: number
  product_name: string
  quantity: number
  purchase_price_ars: number
  total_ars: number
}

type SupplierDetails = {
  supplier: Supplier
  purchases: SupplierPurchase[]
  total_purchases: number
  total_spent: number
}

function formatARS(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value)
}

export default function Proveedores() {
  const [suppliers, setSuppliers] = useState<SupplierWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    contact_name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  })

  useEffect(() => {
    loadSuppliers()
  }, [searchQuery])

  async function loadSuppliers() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append("q", searchQuery)

      const data = await apiGet<SupplierWithStats[]>(`/suppliers/with-stats?${params.toString()}`)
      setSuppliers(data)
    } catch (error) {
      toast.error("Error al cargar proveedores")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateSupplier(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }

    try {
      await apiPost("/suppliers", formData)
      toast.success("Proveedor creado exitosamente")
      setShowCreateModal(false)
      setFormData({ name: "", contact_name: "", phone: "", email: "", address: "", notes: "" })
      loadSuppliers()
    } catch (error) {
      toast.error("Error al crear proveedor")
      console.error(error)
    }
  }

  async function loadSupplierDetails(supplierId: number) {
    setLoadingDetails(true)
    setShowDetailsModal(true)
    try {
      const data = await apiGet<SupplierDetails>(`/suppliers/${supplierId}/purchases`)
      setSelectedSupplier(data)
    } catch (error) {
      toast.error("Error al cargar detalles del proveedor")
      console.error(error)
      setShowDetailsModal(false)
    } finally {
      setLoadingDetails(false)
    }
  }

  function closeDetailsModal() {
    setShowDetailsModal(false)
    setSelectedSupplier(null)
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <i className="bi bi-building me-2"></i>
          Proveedores
        </h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <i className="bi bi-building-add me-1"></i>
          Nuevo Proveedor
        </button>
      </div>

      {/* Search bar */}
      <div className="row mb-3">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="search"
              className="form-control"
              placeholder="Buscar por nombre, contacto o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Suppliers table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
              <p>No se encontraron proveedores</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Nombre</th>
                    <th>Contacto</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Compras</th>
                    <th>Total Gastado</th>
                    <th>Última Compra</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => loadSupplierDetails(supplier.id)}
                    >
                      <td>
                        <strong>{supplier.name}</strong>
                        {supplier.notes && (
                          <div>
                            <small className="text-muted">
                              <i className="bi bi-info-circle me-1"></i>
                              {supplier.notes}
                            </small>
                          </div>
                        )}
                      </td>
                      <td>{supplier.contact_name || "-"}</td>
                      <td>{supplier.email || "-"}</td>
                      <td>{supplier.phone || "-"}</td>
                      <td>
                        <span className="badge bg-secondary">{supplier.total_purchases}</span>
                      </td>
                      <td>
                        <strong>{formatARS(supplier.total_spent)}</strong>
                      </td>
                      <td>
                        {supplier.last_purchase_date ? (
                          <small>{new Date(supplier.last_purchase_date).toLocaleDateString("es-AR")}</small>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={(e) => {
                            e.stopPropagation()
                            loadSupplierDetails(supplier.id)
                          }}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Supplier Modal */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-building-add me-2"></i>
                  Nuevo Proveedor
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowCreateModal(false)
                    setFormData({ name: "", contact_name: "", phone: "", email: "", address: "", notes: "" })
                  }}
                ></button>
              </div>
              <form onSubmit={handleCreateSupplier}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">
                      Nombre de la empresa <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="contact_name" className="form-label">
                      Nombre del contacto
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="contact_name"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="email" className="form-label">
                        Email
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="phone" className="form-label">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="address" className="form-label">
                      Dirección
                    </label>
                    <textarea
                      className="form-control"
                      id="address"
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="notes" className="form-label">
                      Notas
                    </label>
                    <textarea
                      className="form-control"
                      id="notes"
                      rows={2}
                      placeholder="Ej: Productos que ofrece, condiciones de pago, etc."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowCreateModal(false)
                      setFormData({ name: "", contact_name: "", phone: "", email: "", address: "", notes: "" })
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-save me-1"></i>
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Details Modal */}
      {showDetailsModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-building me-2"></i>
                  Detalles del Proveedor
                </h5>
                <button type="button" className="btn-close" onClick={closeDetailsModal}></button>
              </div>
              <div className="modal-body">
                {loadingDetails ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                  </div>
                ) : selectedSupplier ? (
                  <>
                    {/* Supplier Info */}
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <h6 className="text-muted mb-3">Información del Proveedor</h6>
                        <p className="mb-2">
                          <strong>Nombre:</strong> {selectedSupplier.supplier.name}
                        </p>
                        <p className="mb-2">
                          <strong>Contacto:</strong> {selectedSupplier.supplier.contact_name || "-"}
                        </p>
                        <p className="mb-2">
                          <strong>Email:</strong> {selectedSupplier.supplier.email || "-"}
                        </p>
                        <p className="mb-2">
                          <strong>Teléfono:</strong> {selectedSupplier.supplier.phone || "-"}
                        </p>
                        {selectedSupplier.supplier.address && (
                          <p className="mb-2">
                            <strong>Dirección:</strong> {selectedSupplier.supplier.address}
                          </p>
                        )}
                        {selectedSupplier.supplier.notes && (
                          <p className="mb-2">
                            <strong>Notas:</strong> {selectedSupplier.supplier.notes}
                          </p>
                        )}
                        <p className="mb-0">
                          <strong>Proveedor desde:</strong>{" "}
                          {new Date(selectedSupplier.supplier.created_at).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <h6 className="text-muted mb-3">Estadísticas</h6>
                        <div className="card bg-primary bg-opacity-10 border-primary mb-2">
                          <div className="card-body py-2">
                            <small className="text-muted d-block">Total de Compras</small>
                            <h4 className="mb-0">{selectedSupplier.total_purchases}</h4>
                          </div>
                        </div>
                        <div className="card bg-success bg-opacity-10 border-success">
                          <div className="card-body py-2">
                            <small className="text-muted d-block">Total Gastado</small>
                            <h4 className="mb-0">{formatARS(selectedSupplier.total_spent)}</h4>
                          </div>
                        </div>
                      </div>
                    </div>

                    <hr />

                    {/* Recent Purchases */}
                    <h6 className="text-muted mb-3">Historial de Compras</h6>
                    {selectedSupplier.purchases.length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        <i className="bi bi-cart-x fs-1 d-block mb-2"></i>
                        <p>No hay compras registradas</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-sm table-hover">
                          <thead className="table-light">
                            <tr>
                              <th>Fecha</th>
                              <th>Producto</th>
                              <th className="text-center">Cantidad</th>
                              <th className="text-end">Precio Unit.</th>
                              <th className="text-end">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedSupplier.purchases.map((purchase) => (
                              <tr key={purchase.id}>
                                <td>{new Date(purchase.created_at).toLocaleDateString("es-AR")}</td>
                                <td>{purchase.product_name}</td>
                                <td className="text-center">
                                  <span className="badge bg-secondary">{purchase.quantity}</span>
                                </td>
                                <td className="text-end">
                                  {formatARS(purchase.purchase_price_ars)}
                                </td>
                                <td className="text-end">
                                  <strong>{formatARS(purchase.total_ars)}</strong>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="table-light">
                            <tr>
                              <td colSpan={4} className="text-end">
                                <strong>Total:</strong>
                              </td>
                              <td className="text-end">
                                <strong className="text-success">{formatARS(selectedSupplier.total_spent)}</strong>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeDetailsModal}>
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
