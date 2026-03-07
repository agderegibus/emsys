import React from 'react';
import { useBranch } from '../contexts/BranchContext';

export default function BranchSelector() {
  const { currentBranch, availableBranches, setBranch, isLoading } = useBranch();

  if (isLoading || availableBranches.length === 0) {
    return null;
  }

  // Don't show selector if only one branch
  if (availableBranches.length === 1) {
    return (
      <span className="navbar-text me-3">
        <i className="bi bi-building me-1"></i>
        {currentBranch?.name}
      </span>
    );
  }

  return (
    <div className="dropdown me-3">
      <button
        className="btn btn-outline-light dropdown-toggle"
        type="button"
        id="branchDropdown"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <i className="bi bi-building me-1"></i>
        {currentBranch?.name || 'Seleccionar sucursal'}
      </button>
      <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="branchDropdown">
        {availableBranches.map((branch) => (
          <li key={branch.id}>
            <button
              className={`dropdown-item ${currentBranch?.id === branch.id ? 'active' : ''}`}
              onClick={() => setBranch(branch.id)}
            >
              <span className="badge bg-secondary me-2">{branch.code}</span>
              {branch.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
