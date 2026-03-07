import { useEffect, useState } from "react"
import { toast } from "sonner"
import { apiGet, apiPost } from "@/lib/api"
import { useBranch } from "@/contexts/BranchContext"

type Customer = {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
  created_at: string
}

type CustomerWithStats = Customer & {
  total_purchases: number
  total_spent: number
  last_purchase_date: string | null
}

type CustomerSale = {
  id: number
  created_at: string
  total_ars: number
  is_invoiced: boolean
  items_count: number
}

type CustomerDetails = {
  customer: Customer
  sales: CustomerSale[]
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

export default function Clientes() {
  const { currentBranch } = useBranch()
  const [customers, setCustomers] = useState<CustomerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  })

  // Reload customers when branch or search query changes
  useEffect(() => {
    loadCustomers()
  }, [searchQuery, currentBranch?.id])

  async function loadCustomers() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append("q", searchQuery)

      const data = await apiGet<CustomerWithStats[]>(`/customers/with-stats?${params.toString()}`)
      setCustomers(data)
    } catch (error) {
      toast.error("Error al cargar clientes")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }

    try {
      await apiPost("/customers", formData)
      toast.success("Cliente creado exitosamente")
      setShowCreateModal(false)
      setFormData({ name: "", phone: "", email: "", address: "" })
      loadCustomers()
    } catch (error) {
      toast.error("Error al crear cliente")
      console.error(error)
    }
  }

  async function loadCustomerDetails(customerId: number) {
    setLoadingDetails(true)
    setShowDetailsModal(true)
    try {
      const data = await apiGet<CustomerDetails>(`/customers/${customerId}/sales`)
      setSelectedCustomer(data)
    } catch (error) {
      toast.error("Error al cargar detalles del cliente")
      console.error(error)
      setShowDetailsModal(false)
    } finally {
      setLoadingDetails(false)
    }
  }

  function closeDetailsModal() {
    setShowDetailsModal(false)
    setSelectedCustomer(null)
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <i className="bi bi-people-fill me-2"></i>
          Clientes
        </h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <i className="bi bi-person-plus me-1"></i>
          Nuevo Cliente
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
              placeholder="Buscar por nombre, teléfono o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Customers table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
              <p>No se encontraron clientes</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Compras</th>
                    <th>Total Gastado</th>
                    <th>Última Compra</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => loadCustomerDetails(customer.id)}
                    >
                      <td>
                        <strong>{customer.name}</strong>
                        {customer.address && (
                          <div>
                            <small className="text-muted">
                              <i className="bi bi-geo-alt me-1"></i>
                              {customer.address}
                            </small>
                          </div>
                        )}
                      </td>
                      <td>{customer.email || "-"}</td>
                      <td>{customer.phone || "-"}</td>
                      <td>
                        <span className="badge bg-secondary">{customer.total_purchases}</span>
                      </td>
                      <td>
                        <strong>{formatARS(customer.total_spent)}</strong>
                      </td>
                      <td>
                        {customer.last_purchase_date ? (
                          <small>{new Date(customer.last_purchase_date).toLocaleDateString("es-AR")}</small>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={(e) => {
                            e.stopPropagation()
                            loadCustomerDetails(customer.id)
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

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-plus me-2"></i>
                  Nuevo Cliente
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowCreateModal(false)
                    setFormData({ name: "", phone: "", email: "", address: "" })
                  }}
                ></button>
              </div>
              <form onSubmit={handleCreateCustomer}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">
                      Nombre completo <span className="text-danger">*</span>
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
                  <div className="mb-3">
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
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowCreateModal(false)
                      setFormData({ name: "", phone: "", email: "", address: "" })
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

      {/* Customer Details Modal */}
      {showDetailsModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-circle me-2"></i>
                  Detalles del Cliente
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
                ) : selectedCustomer ? (
                  <>
                    {/* Customer Info */}
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <h6 className="text-muted mb-3">Información Personal</h6>
                        <p className="mb-2">
                          <strong>Nombre:</strong> {selectedCustomer.customer.name}
                        </p>
                        <p className="mb-2">
                          <strong>Email:</strong> {selectedCustomer.customer.email || "-"}
                        </p>
                        <p className="mb-2">
                          <strong>Teléfono:</strong> {selectedCustomer.customer.phone || "-"}
                        </p>
                        {selectedCustomer.customer.address && (
                          <p className="mb-2">
                            <strong>Dirección:</strong> {selectedCustomer.customer.address}
                          </p>
                        )}
                        <p className="mb-0">
                          <strong>Cliente desde:</strong>{" "}
                          {new Date(selectedCustomer.customer.created_at).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <h6 className="text-muted mb-3">Estadísticas</h6>
                        <div className="card bg-primary bg-opacity-10 border-primary mb-2">
                          <div className="card-body py-2">
                            <small className="text-muted d-block">Total de Compras</small>
                            <h4 className="mb-0">{selectedCustomer.total_purchases}</h4>
                          </div>
                        </div>
                        <div className="card bg-success bg-opacity-10 border-success">
                          <div className="card-body py-2">
                            <small className="text-muted d-block">Total Gastado</small>
                            <h4 className="mb-0">{formatARS(selectedCustomer.total_spent)}</h4>
                          </div>
                        </div>
                      </div>
                    </div>

                    <hr />

                    {/* Recent Purchases */}
                    <h6 className="text-muted mb-3">Compras Recientes</h6>
                    {selectedCustomer.sales.length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        <i className="bi bi-cart-x fs-1 d-block mb-2"></i>
                        <p>No hay compras registradas</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-sm table-hover">
                          <thead className="table-light">
                            <tr>
                              <th>Venta #</th>
                              <th>Fecha</th>
                              <th>Items</th>
                              <th>Total</th>
                              <th>Factura</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedCustomer.sales.map((sale) => (
                              <tr key={sale.id}>
                                <td>#{sale.id}</td>
                                <td>{new Date(sale.created_at).toLocaleString("es-AR")}</td>
                                <td>
                                  <span className="badge bg-secondary">{sale.items_count}</span>
                                </td>
                                <td>
                                  <strong>{formatARS(sale.total_ars)}</strong>
                                </td>
                                <td>
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
