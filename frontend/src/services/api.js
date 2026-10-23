const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  static getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('inventory_token');
    }
    return null;
  }

  static async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined') {
          // Token expired or invalid
          localStorage.removeItem('inventory_token');
          localStorage.removeItem('inventory_user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        const error = new Error(data.message || 'API request failed');
        error.status = response.status;
        error.errors = data.errors;
        throw error;
      }

      return data.data;
    } catch (err) {
      throw err;
    }
  }

  static buildQueryString(params = {}) {
    const validParams = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '' && value !== 'undefined') {
        validParams[key] = value;
      }
    }
    const query = new URLSearchParams(validParams).toString();
    return query ? `?${query}` : '';
  }

  // --- Auth Endpoints ---
  static async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  static async getMe() {
    return this.request('/auth/me');
  }

  static async updateMe(data) {
    return this.request('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // --- Product Endpoints ---
  static async getProducts(params = {}) {
    return this.request(`/products${this.buildQueryString(params)}`);
  }

  static async getCategories() {
    return this.request('/products/categories');
  }

  static async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  static async createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  static async updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  static async adjustStock(id, { quantity, unit, type, notes }) {
    return this.request(`/products/${id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({ quantity, unit, type, notes }),
    });
  }

  static async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Order & POS Endpoints ---
  static async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  static async getOrders(params = {}) {
    return this.request(`/orders${this.buildQueryString(params)}`);
  }

  static async getOrder(id) {
    return this.request(`/orders/${id}`);
  }

  static async cancelOrder(id, reason) {
    return this.request(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // --- History & Analytics Endpoints ---
  static async getStockLogs(params = {}) {
    return this.request(`/history/stock-logs${this.buildQueryString(params)}`);
  }

  static async getDashboardMetrics() {
    return this.request('/history/dashboard-metrics');
  }
}

export default ApiClient;
