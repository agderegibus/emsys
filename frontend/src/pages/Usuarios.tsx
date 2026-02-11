import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { apiGet, apiPost } from "@/lib/api"

type User = {
  id: number
  username: string
  email: string
  is_active: boolean
}

type NewUserForm = {
  username: string
  email: string
  is_active: boolean
}

export default function Usuarios() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<NewUserForm>({
    username: "",
    email: "",
    is_active: true,
  })

  useEffect(() => {
    setLoading(true)
    apiGet<User[]>("/users")
      .then(setUsers)
      .catch(() => toast.error("No se pudieron cargar los usuarios"))
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const active = users.filter(u => u.is_active).length
    const inactive = users.filter(u => !u.is_active).length
    return { total: users.length, active, inactive }
  }, [users])

  const canSave = useMemo(() => {
    return form.username.trim().length >= 3 && form.email.trim().includes("@")
  }, [form])

  function resetForm() {
    setForm({ username: "", email: "", is_active: true })
  }

  async function handleCreate() {
    if (!canSave || saving) return

    try {
      setSaving(true)
      const created = await apiPost<User>("/users", {
        username: form.username.trim(),
        email: form.email.trim(),
      })

      setUsers((prev) => [created, ...prev])
      toast.success("Usuario creado exitosamente", {
        description: `${created.username} - ${created.email}`
      })

      // Close modal
      const modal = document.getElementById('createModal')
      if (modal) {
        const bsModal = (window as any).bootstrap.Modal.getInstance(modal)
        bsModal?.hide()
      }

      resetForm()
    } catch {
      toast.error("No se pudo crear el usuario")
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(id: number) {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return

    setUsers(prev => prev.filter(u => u.id !== id))
    toast.success("Usuario eliminado")
  }

  function toggleActive(id: number) {
    setUsers(prev => prev.map(u =>
      u.id === id ? { ...u, is_active: !u.is_active } : u
    ))
  }

  function getInitials(username: string): string {
    return username
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || username.slice(0, 2).toUpperCase()
  }

  return (
    <div>
      {/* Header - Horizontal */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-0">
            <i className="bi bi-people me-2"></i>
            Gestión de Usuarios
          </h3>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <span className="badge bg-secondary">{stats.total} total</span>
          <span className="badge bg-success">{stats.active} activos</span>
          <span className="badge bg-danger">{stats.inactive} inactivos</span>
          <button
            className="btn btn-primary btn-sm"
            data-bs-toggle="modal"
            data-bs-target="#createModal"
          >
            <i className="bi bi-plus-lg me-1"></i>
            Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-body p-0">
          <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            <table className="table table-hover table-sm mb-0">
              <thead className="table-light sticky-top">
                <tr>
                  <th style={{ width: "8%" }}>#ID</th>
                  <th style={{ width: "25%" }}>Usuario</th>
                  <th style={{ width: "30%" }}>Email</th>
                  <th style={{ width: "12%" }} className="text-center">Estado</th>
                  <th style={{ width: "25%" }} className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      <i className="bi bi-people fs-1 d-block mb-2"></i>
                      No hay usuarios registrados
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td className="text-muted">
                        <strong>#{u.id}</strong>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px', minWidth: '32px' }}
                          >
                            <small className="text-primary fw-bold">
                              {getInitials(u.username)}
                            </small>
                          </div>
                          <div>
                            <div className="fw-semibold">{u.username}</div>
                            <small className="text-muted">Usuario del sistema</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <i className="bi bi-envelope text-muted"></i>
                          <small>{u.email}</small>
                        </div>
                      </td>
                      <td className="text-center">
                        {u.is_active ? (
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
                            className={`btn ${u.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => toggleActive(u.id)}
                            title={u.is_active ? 'Desactivar' : 'Activar'}
                          >
                            <i className={`bi ${u.is_active ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                          </button>
                          <button
                            className="btn btn-outline-primary"
                            title="Editar"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDelete(u.id)}
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

      {/* Create User Modal */}
      <div
        className="modal fade"
        id="createModal"
        tabIndex={-1}
        data-bs-backdrop="static"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-person-plus me-2"></i>
                Crear Nuevo Usuario
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
                <div className="col-12">
                  <label className="form-label">
                    <i className="bi bi-person me-1"></i>
                    Nombre de Usuario <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: admin, jperez"
                    value={form.username}
                    onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  />
                  <small className="text-muted">
                    Mínimo 3 caracteres, será usado para iniciar sesión
                  </small>
                </div>

                <div className="col-12">
                  <label className="form-label">
                    <i className="bi bi-envelope me-1"></i>
                    Correo Electrónico <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="usuario@empanadas.com"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  />
                  <small className="text-muted">
                    Dirección de email válida para notificaciones
                  </small>
                </div>

                <div className="col-12">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="activeSwitch"
                      checked={form.is_active}
                      onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                    />
                    <label className="form-check-label" htmlFor="activeSwitch">
                      <i className="bi bi-shield-check me-1"></i>
                      Usuario activo
                      <br />
                      <small className="text-muted">
                        Los usuarios inactivos no pueden acceder al sistema
                      </small>
                    </label>
                  </div>
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
                disabled={!canSave || saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-plus-lg me-1"></i>
                    Crear Usuario
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
