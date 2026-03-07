const API_BASE = "http://127.0.0.1:8000"

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  const token = localStorage.getItem('auth_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const branchId = localStorage.getItem('current_branch_id')
  if (branchId) {
    headers['X-Branch-ID'] = branchId
  }

  return headers
}

async function handleResponse<T>(res: Response, path: string, method: string): Promise<T> {
  if (res.status === 401) {
    // Token expired or invalid, redirect to login
    localStorage.removeItem('auth_token')
    localStorage.removeItem('current_branch_id')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    let errorMessage = `${method} ${path} failed: ${res.status}`
    try {
      const errorData = await res.json()
      if (errorData.detail) {
        errorMessage = errorData.detail
      }
    } catch {
      // If JSON parsing fails, use the default error message
    }
    throw new Error(errorMessage)
  }

  // Handle empty responses (204 No Content)
  if (res.status === 204) {
    return undefined as T
  }

  return res.json()
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: getAuthHeaders(),
  })
  return handleResponse<T>(res, path, 'GET')
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  return handleResponse<T>(res, path, 'POST')
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  return handleResponse<T>(res, path, 'PUT')
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
  return handleResponse<T>(res, path, 'DELETE')
}

// Special function for form data (like login)
export async function apiPostForm<T>(path: string, formData: URLSearchParams): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  })
  return handleResponse<T>(res, path, 'POST')
}
