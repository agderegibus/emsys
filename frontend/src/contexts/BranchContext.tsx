import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface Branch {
  id: number;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  is_active: boolean;
}

interface BranchContextType {
  currentBranch: Branch | null;
  availableBranches: Branch[];
  setBranch: (branchId: number) => void;
  isLoading: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

const API_BASE = 'http://127.0.0.1:8000';

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user, token, isAdmin } = useAuth();
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load branches when user is available
  useEffect(() => {
    if (user && token) {
      loadBranches();
    } else {
      setAvailableBranches([]);
      setCurrentBranch(null);
      setIsLoading(false);
    }
  }, [user, token]);

  const loadBranches = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/branches/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const branches = await res.json();
        setAvailableBranches(branches);

        // Restore saved branch or use first available
        const savedBranchId = localStorage.getItem('current_branch_id');
        if (savedBranchId) {
          const savedBranch = branches.find((b: Branch) => b.id === parseInt(savedBranchId));
          if (savedBranch) {
            setCurrentBranch(savedBranch);
          } else if (branches.length > 0) {
            setCurrentBranch(branches[0]);
            localStorage.setItem('current_branch_id', branches[0].id.toString());
          }
        } else if (branches.length > 0) {
          setCurrentBranch(branches[0]);
          localStorage.setItem('current_branch_id', branches[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Error loading branches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setBranch = (branchId: number) => {
    const branch = availableBranches.find(b => b.id === branchId);
    if (branch) {
      setCurrentBranch(branch);
      localStorage.setItem('current_branch_id', branchId.toString());
    }
  };

  return (
    <BranchContext.Provider value={{ currentBranch, availableBranches, setBranch, isLoading }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
