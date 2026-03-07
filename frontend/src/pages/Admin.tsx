import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

interface Branch {
  id: number;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  is_active: boolean;
  user_count?: number;
  sale_count?: number;
  total_sales_ars?: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'cajero';
  is_active: boolean;
  branches: { id: number; name: string; code: string }[];
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'users' | 'branches'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // User form state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'cajero' as 'admin' | 'cajero',
    branch_ids: [] as number[],
  });

  // Branch form state
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersData, branchesData] = await Promise.all([
        apiGet<User[]>('/users/'),
        apiGet<Branch[]>('/branches/with-stats'),
      ]);
      setUsers(usersData);
      setBranches(branchesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  // User functions
  const handleCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      email: '',
      password: '',
      role: 'cajero',
      branch_ids: [],
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      branch_ids: user.branches.map(b => b.id),
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        await apiPut(`/users/${editingUser.id}`, {
          ...userForm,
          password: userForm.password || undefined,
        });
      } else {
        await apiPost('/users/', userForm);
      }
      setShowUserModal(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving user');
    }
  };

  const handleToggleUserActive = async (user: User) => {
    try {
      await apiPost(`/users/${user.id}/toggle-active`, {});
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error toggling user status');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Eliminar usuario ${user.username}?`)) return;
    try {
      await apiDelete(`/users/${user.id}`);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting user');
    }
  };

  // Branch functions
  const handleCreateBranch = () => {
    setEditingBranch(null);
    setBranchForm({
      name: '',
      code: '',
      address: '',
      phone: '',
    });
    setShowBranchModal(true);
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchForm({
      name: branch.name,
      code: branch.code,
      address: branch.address || '',
      phone: branch.phone || '',
    });
    setShowBranchModal(true);
  };

  const handleSaveBranch = async () => {
    try {
      if (editingBranch) {
        await apiPut(`/branches/${editingBranch.id}`, branchForm);
      } else {
        await apiPost('/branches/', branchForm);
      }
      setShowBranchModal(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving branch');
    }
  };

  const toggleBranchSelection = (branchId: number) => {
    setUserForm(prev => ({
      ...prev,
      branch_ids: prev.branch_ids.includes(branchId)
        ? prev.branch_ids.filter(id => id !== branchId)
        : [...prev.branch_ids, branchId]
    }));
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">
          <i className="bi bi-gear me-2"></i>
          Administracion
        </h1>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="bi bi-people me-1"></i>
            Usuarios ({users.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'branches' ? 'active' : ''}`}
            onClick={() => setActiveTab('branches')}
          >
            <i className="bi bi-building me-1"></i>
            Sucursales ({branches.length})
          </button>
        </li>
      </ul>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span>Usuarios del Sistema</span>
            <button className="btn btn-primary btn-sm" onClick={handleCreateUser}>
              <i className="bi bi-plus me-1"></i>
              Nuevo Usuario
            </button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Sucursales</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.username}</strong>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${user.role === 'admin' ? 'bg-danger' : 'bg-info'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        {user.branches.map(b => (
                          <span key={b.id} className="badge bg-secondary me-1">
                            {b.code}
                          </span>
                        ))}
                        {user.branches.length === 0 && (
                          <span className="text-muted">Sin asignar</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${user.is_active ? 'bg-success' : 'bg-warning'}`}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => handleEditUser(user)}
                          title="Editar"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className={`btn btn-sm ${user.is_active ? 'btn-outline-warning' : 'btn-outline-success'} me-1`}
                          onClick={() => handleToggleUserActive(user)}
                          title={user.is_active ? 'Desactivar' : 'Activar'}
                        >
                          <i className={`bi ${user.is_active ? 'bi-pause' : 'bi-play'}`}></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteUser(user)}
                          title="Eliminar"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Branches Tab */}
      {activeTab === 'branches' && (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span>Sucursales</span>
            <button className="btn btn-primary btn-sm" onClick={handleCreateBranch}>
              <i className="bi bi-plus me-1"></i>
              Nueva Sucursal
            </button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Codigo</th>
                    <th>Nombre</th>
                    <th>Direccion</th>
                    <th>Telefono</th>
                    <th>Usuarios</th>
                    <th>Ventas</th>
                    <th>Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map(branch => (
                    <tr key={branch.id}>
                      <td>
                        <span className="badge bg-primary">{branch.code}</span>
                      </td>
                      <td><strong>{branch.name}</strong></td>
                      <td>{branch.address || '-'}</td>
                      <td>{branch.phone || '-'}</td>
                      <td>
                        <span className="badge bg-info">{branch.user_count || 0}</span>
                      </td>
                      <td>
                        <span className="badge bg-secondary">{branch.sale_count || 0}</span>
                      </td>
                      <td>
                        ${(branch.total_sales_ars || 0).toLocaleString('es-AR')}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEditBranch(branch)}
                          title="Editar"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowUserModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Usuario</label>
                  <input
                    type="text"
                    className="form-control"
                    value={userForm.username}
                    onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Contrasena {editingUser && '(dejar vacio para mantener)'}
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    value={userForm.password}
                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                    required={!editingUser}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Rol</label>
                  <select
                    className="form-select"
                    value={userForm.role}
                    onChange={e => setUserForm({ ...userForm, role: e.target.value as 'admin' | 'cajero' })}
                  >
                    <option value="cajero">Cajero</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Sucursales</label>
                  <div className="border rounded p-2">
                    {branches.map(branch => (
                      <div key={branch.id} className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id={`branch-${branch.id}`}
                          checked={userForm.branch_ids.includes(branch.id)}
                          onChange={() => toggleBranchSelection(branch.id)}
                        />
                        <label className="form-check-label" htmlFor={`branch-${branch.id}`}>
                          <span className="badge bg-secondary me-1">{branch.code}</span>
                          {branch.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveUser}>
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Branch Modal */}
      {showBranchModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowBranchModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    value={branchForm.name}
                    onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Codigo (3-4 letras)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={branchForm.code}
                    onChange={e => setBranchForm({ ...branchForm, code: e.target.value.toUpperCase() })}
                    maxLength={4}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Direccion</label>
                  <input
                    type="text"
                    className="form-control"
                    value={branchForm.address}
                    onChange={e => setBranchForm({ ...branchForm, address: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Telefono</label>
                  <input
                    type="text"
                    className="form-control"
                    value={branchForm.phone}
                    onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBranchModal(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveBranch}>
                  {editingBranch ? 'Guardar Cambios' : 'Crear Sucursal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
