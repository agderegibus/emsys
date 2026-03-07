import { NavLink, Outlet } from "react-router-dom"
import { useTheme } from "@/contexts/ThemeContext"
import { useAuth } from "@/contexts/AuthContext"
import BranchSelector from "@/components/BranchSelector"

export default function AppLayout() {
  const { theme, toggleTheme } = useTheme()
  const { user, isAdmin, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <NavLink className="navbar-brand" to="/">
            <i className="bi bi-shop me-2"></i>
            Empanadas System
          </NavLink>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <NavLink
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                  to="/"
                  end
                >
                  <i className="bi bi-cart3 me-1"></i>
                  POS
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                  to="/productos"
                >
                  <i className="bi bi-box-seam me-1"></i>
                  Productos
                </NavLink>
              </li>
              {isAdmin && (
                <li className="nav-item">
                  <NavLink
                    className={({ isActive }) =>
                      isActive ? "nav-link active" : "nav-link"
                    }
                    to="/stock"
                  >
                    <i className="bi bi-box-seam-fill me-1"></i>
                    Stock
                  </NavLink>
                </li>
              )}
              <li className="nav-item">
                <NavLink
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                  to="/clientes"
                >
                  <i className="bi bi-people-fill me-1"></i>
                  Clientes
                </NavLink>
              </li>
              {isAdmin && (
                <>
                  <li className="nav-item">
                    <NavLink
                      className={({ isActive }) =>
                        isActive ? "nav-link active" : "nav-link"
                      }
                      to="/proveedores"
                    >
                      <i className="bi bi-building me-1"></i>
                      Proveedores
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className={({ isActive }) =>
                        isActive ? "nav-link active" : "nav-link"
                      }
                      to="/empleados"
                    >
                      <i className="bi bi-person-badge-fill me-1"></i>
                      Empleados
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className={({ isActive }) =>
                        isActive ? "nav-link active" : "nav-link"
                      }
                      to="/analytics"
                    >
                      <i className="bi bi-graph-up me-1"></i>
                      Analytics
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className={({ isActive }) =>
                        isActive ? "nav-link active" : "nav-link"
                      }
                      to="/admin"
                    >
                      <i className="bi bi-gear me-1"></i>
                      Admin
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
            <div className="d-flex align-items-center">
              <BranchSelector />
              <button
                className="btn btn-outline-light btn-sm me-3"
                onClick={toggleTheme}
                title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              >
                <i className={`bi bi-${theme === "dark" ? "sun-fill" : "moon-stars-fill"}`}></i>
              </button>
              <div className="dropdown">
                <button
                  className="btn btn-outline-light btn-sm dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  <i className="bi bi-person-circle me-1"></i>
                  {user?.username || 'Usuario'}
                  {isAdmin && (
                    <span className="badge bg-danger ms-1">Admin</span>
                  )}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <span className="dropdown-item-text">
                      <strong>{user?.username}</strong>
                      <br />
                      <small className="text-muted">{user?.email}</small>
                      <br />
                      <span className={`badge ${user?.role === 'admin' ? 'bg-danger' : 'bg-info'}`}>
                        {user?.role}
                      </span>
                    </span>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>Cerrar sesion
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow-1 bg-light">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white text-center py-3">
        <div className="container">
          <small>© 2026 Empanadas System - Sistema de Gestion Gastronomica</small>
        </div>
      </footer>
    </div>
  )
}
