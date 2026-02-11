import { useEffect, useState } from "react"
import { toast } from "sonner"
import { apiGet } from "@/lib/api"

type DeliveryPerson = {
  id: number
  name: string
  phone: string | null
  is_active: boolean
}

type DeliveryPersonStats = {
  delivery_person_id: number
  delivery_person_name: string
  date: string
  total_deliveries: number
  total_amount: number
  cash_amount: number  // Lo que debe rendir (efectivo)
  card_amount: number
  mercadopago_amount: number
}

type DeliveryDetail = {
  id: number
  created_at: string
  total_ars: number
  payment_method: string | null
  delivery_address: string | null
  is_invoiced: boolean
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

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date))
}

export default function Empleados() {
  const [activeTab, setActiveTab] = useState<"cadetes" | "cajeros">("cadetes")
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([])
  const [deliveryStats, setDeliveryStats] = useState<Map<number, DeliveryPersonStats>>(new Map())
  const [cashierStats, setCashierStats] = useState<CashierStats[]>([])
  const [loading, setLoading] = useState(true)

  // Selected delivery person for details
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState<DeliveryPerson | null>(null)
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetail[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Selected cashier for details
  const [selectedCashier, setSelectedCashier] = useState<CashierStats | null>(null)

  const today = new Date().toISOString().split("T")[0]

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Load delivery persons
      const persons = await apiGet<DeliveryPerson[]>("/delivery-persons")
      setDeliveryPersons(persons.filter(p => p.is_active))

      // Load today's stats for each delivery person
      const statsMap = new Map<number, DeliveryPersonStats>()
      await Promise.all(
        persons.map(async (person) => {
          try {
            const stats = await apiGet<DeliveryPersonStats>(
              `/delivery-persons/${person.id}/stats?date=${today}`
            )
            statsMap.set(person.id, stats)
          } catch {
            // Ignore errors for individual stats
          }
        })
      )
      setDeliveryStats(statsMap)

      // Load cashier stats
      const cashiers = await apiGet<CashierStats[]>(
        `/analytics/cashiers?start_date=${today}&end_date=${today}`
      )
      setCashierStats(cashiers)
    } catch (error) {
      toast.error("No se pudieron cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  async function loadDeliveryDetails(deliveryPerson: DeliveryPerson) {
    setSelectedDeliveryPerson(deliveryPerson)
    setLoadingDetails(true)
    try {
      const details = await apiGet<DeliveryDetail[]>(
        `/delivery-persons/${deliveryPerson.id}/deliveries?date=${today}`
      )
      setDeliveryDetails(details)
    } catch {
      toast.error("No se pudieron cargar los detalles")
    } finally {
      setLoadingDetails(false)
    }
  }

  const totalDeliveriesToday = Array.from(deliveryStats.values()).reduce(
    (sum, stat) => sum + stat.total_deliveries,
    0
  )

  const totalCashToDeliver = Array.from(deliveryStats.values()).reduce(
    (sum, stat) => sum + stat.cash_amount,
    0
  )

  const totalDeliveryAmount = Array.from(deliveryStats.values()).reduce(
    (sum, stat) => sum + stat.total_amount,
    0
  )

  const totalCashierSales = cashierStats.reduce((sum, stat) => sum + stat.total_sales, 0)
  const totalCashierAmount = cashierStats.reduce((sum, stat) => sum + stat.total_amount, 0)

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-0">
            <i className="bi bi-people-fill me-2"></i>
            Empleados
          </h3>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <span className="badge bg-secondary">Hoy: {today}</span>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "cadetes" ? "active" : ""}`}
            onClick={() => setActiveTab("cadetes")}
          >
            <i className="bi bi-truck me-1"></i>
            Cadetes
            {deliveryPersons.length > 0 && (
              <span className="badge bg-primary ms-2">{deliveryPersons.length}</span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "cajeros" ? "active" : ""}`}
            onClick={() => setActiveTab("cajeros")}
          >
            <i className="bi bi-person-badge me-1"></i>
            Cajeros
            {cashierStats.length > 0 && (
              <span className="badge bg-primary ms-2">{cashierStats.length}</span>
            )}
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      {activeTab === "cadetes" && (
        <div className="row">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header bg-primary bg-opacity-10">
                <h5 className="mb-0">
                  <i className="bi bi-truck me-2"></i>
                  Cadetes - Estadísticas del Día
                </h5>
              </div>
              <div className="card-body p-0">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Cargando cadetes...
                  </div>
                ) : deliveryPersons.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                    No hay cadetes registrados
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Cadete</th>
                          <th className="text-center">Deliveries</th>
                          <th className="text-end bg-success bg-opacity-10">
                            <i className="bi bi-cash-stack me-1"></i>
                            A Rendir (Efectivo)
                          </th>
                          <th className="text-center">Tarjeta</th>
                          <th className="text-center">MercadoPago</th>
                          <th className="text-end">Total Vendido</th>
                          <th className="text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveryPersons.map((person) => {
                          const stats = deliveryStats.get(person.id)
                          return (
                            <tr key={person.id}>
                              <td>
                                <div className="fw-semibold">{person.name}</div>
                                {person.phone && (
                                  <small className="text-muted">
                                    <i className="bi bi-phone me-1"></i>
                                    {person.phone}
                                  </small>
                                )}
                              </td>
                              <td className="text-center">
                                <span className="badge bg-dark fs-6">
                                  {stats?.total_deliveries || 0}
                                </span>
                              </td>
                              <td className="text-end bg-success bg-opacity-10">
                                <strong className="text-success fs-5">
                                  {formatARS(stats?.cash_amount || 0)}
                                </strong>
                              </td>
                              <td className="text-center">
                                {stats?.card_amount ? (
                                  <span className="badge bg-primary">
                                    {formatARS(stats.card_amount)}
                                  </span>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>
                              <td className="text-center">
                                {stats?.mercadopago_amount ? (
                                  <span className="badge bg-info">
                                    {formatARS(stats.mercadopago_amount)}
                                  </span>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>
                              <td className="text-end">
                                <small className="text-muted">
                                  {formatARS(stats?.total_amount || 0)}
                                </small>
                              </td>
                              <td className="text-center">
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => loadDeliveryDetails(person)}
                                >
                                  <i className="bi bi-eye me-1"></i>
                                  Ver
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="table-light">
                        <tr>
                          <td><strong>TOTALES</strong></td>
                          <td className="text-center">
                            <strong>{totalDeliveriesToday}</strong>
                          </td>
                          <td className="text-end bg-success bg-opacity-10">
                            <strong className="text-success fs-5">
                              {formatARS(totalCashToDeliver)}
                            </strong>
                          </td>
                          <td className="text-center">
                            <strong>
                              {formatARS(
                                Array.from(deliveryStats.values()).reduce(
                                  (sum, stat) => sum + stat.card_amount,
                                  0
                                )
                              )}
                            </strong>
                          </td>
                          <td className="text-center">
                            <strong>
                              {formatARS(
                                Array.from(deliveryStats.values()).reduce(
                                  (sum, stat) => sum + stat.mercadopago_amount,
                                  0
                                )
                              )}
                            </strong>
                          </td>
                          <td className="text-end">
                            <strong className="text-muted">
                              {formatARS(totalDeliveryAmount)}
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

          {/* Delivery Details Panel */}
          <div className="col-md-4">
            <div className="card">
              <div className="card-header bg-info bg-opacity-10">
                <h6 className="mb-0">
                  <i className="bi bi-list-ul me-2"></i>
                  Detalles de Pedidos
                </h6>
              </div>
              <div className="card-body">
                {!selectedDeliveryPerson ? (
                  <div className="text-center text-muted py-4">
                    <i className="bi bi-arrow-left fs-2 d-block mb-2"></i>
                    <small>Selecciona un cadete para ver sus pedidos</small>
                  </div>
                ) : loadingDetails ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm"></div>
                  </div>
                ) : (
                  <>
                    <h6 className="mb-3">{selectedDeliveryPerson.name}</h6>
                    {deliveryDetails.length === 0 ? (
                      <div className="text-center text-muted py-3">
                        <i className="bi bi-inbox fs-3 d-block mb-2"></i>
                        <small>Sin deliveries hoy</small>
                      </div>
                    ) : (
                      <>
                        <div className="alert alert-success py-2 px-3 mb-2">
                          <strong>
                            <i className="bi bi-cash-stack me-2"></i>
                            A Rendir: {formatARS(
                              deliveryDetails
                                .filter((d) => d.payment_method === "efectivo")
                                .reduce((sum, d) => sum + d.total_ars, 0)
                            )}
                          </strong>
                        </div>
                        <div className="list-group list-group-flush">
                          {deliveryDetails.map((delivery) => {
                            const isEffectivo = delivery.payment_method === "efectivo"
                            return (
                              <div
                                key={delivery.id}
                                className={`list-group-item px-0 ${isEffectivo ? "bg-success bg-opacity-10" : ""}`}
                              >
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                  <small className="text-muted">
                                    <i className="bi bi-clock me-1"></i>
                                    {formatDateTime(delivery.created_at)}
                                  </small>
                                  <strong className={isEffectivo ? "text-success" : "text-muted"}>
                                    {formatARS(delivery.total_ars)}
                                    {isEffectivo && (
                                      <i className="bi bi-cash ms-1 text-success"></i>
                                    )}
                                  </strong>
                                </div>
                                <small className="text-muted d-block">
                                  <i className="bi bi-geo-alt me-1"></i>
                                  {delivery.delivery_address || "Sin dirección"}
                                </small>
                                {delivery.payment_method && (
                                  <small className="d-block">
                                    <i className="bi bi-credit-card me-1"></i>
                                    <span className={`text-capitalize ${isEffectivo ? "text-success fw-bold" : "text-muted"}`}>
                                      {delivery.payment_method}
                                    </span>
                                  </small>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "cajeros" && (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-success bg-opacity-10">
                <h5 className="mb-0">
                  <i className="bi bi-person-badge me-2"></i>
                  Cajeros - Estadísticas del Día
                </h5>
              </div>
              <div className="card-body p-0">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Cargando cajeros...
                  </div>
                ) : cashierStats.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                    No hay ventas registradas hoy
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Cajero</th>
                          <th className="text-center">Ventas Hoy</th>
                          <th className="text-end">Total del Día</th>
                          <th className="text-center">Efectivo</th>
                          <th className="text-center">Tarjeta</th>
                          <th className="text-center">MercadoPago</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cashierStats.map((stat, idx) => (
                          <tr
                            key={idx}
                            style={{ cursor: "pointer" }}
                            onClick={() => setSelectedCashier(stat)}
                            className={selectedCashier?.cashier === stat.cashier ? "table-active" : ""}
                          >
                            <td>
                              <div className="fw-semibold">
                                <i className="bi bi-person-circle me-2"></i>
                                {stat.cashier}
                              </div>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-dark fs-6">{stat.total_sales}</span>
                            </td>
                            <td className="text-end">
                              <strong className="text-success">
                                {formatARS(stat.total_amount)}
                              </strong>
                            </td>
                            <td className="text-center">
                              {stat.payment_methods.efectivo > 0 ? (
                                <span className="badge bg-success">
                                  💵 {formatARS(stat.payment_methods.efectivo)}
                                </span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                            <td className="text-center">
                              {stat.payment_methods.tarjeta > 0 ? (
                                <span className="badge bg-primary">
                                  💳 {formatARS(stat.payment_methods.tarjeta)}
                                </span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                            <td className="text-center">
                              {stat.payment_methods.mercadopago > 0 ? (
                                <span className="badge bg-info">
                                  📱 {formatARS(stat.payment_methods.mercadopago)}
                                </span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="table-light">
                        <tr>
                          <td><strong>TOTALES</strong></td>
                          <td className="text-center">
                            <strong>{totalCashierSales}</strong>
                          </td>
                          <td className="text-end">
                            <strong className="text-success">{formatARS(totalCashierAmount)}</strong>
                          </td>
                          <td className="text-center">
                            <strong>
                              {formatARS(
                                cashierStats.reduce((sum, c) => sum + c.payment_methods.efectivo, 0)
                              )}
                            </strong>
                          </td>
                          <td className="text-center">
                            <strong>
                              {formatARS(
                                cashierStats.reduce((sum, c) => sum + c.payment_methods.tarjeta, 0)
                              )}
                            </strong>
                          </td>
                          <td className="text-center">
                            <strong>
                              {formatARS(
                                cashierStats.reduce((sum, c) => sum + c.payment_methods.mercadopago, 0)
                              )}
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
        </div>
      )}
    </div>
  )
}
