class Auth {
  constructor() {
    this.token = localStorage.getItem("token");
    this.user = JSON.parse(localStorage.getItem("user"));
    this.baseUrl = "/api";
  }

  isAuthenticated() {
    return !!this.token;
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      this.setSession(data);
      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      const data = await response.json();
      this.setSession(data);
      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  async verifyEmail(token) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      return response.ok;
    } catch (error) {
      console.error("Email verification error:", error);
      throw error;
    }
  }

  async resetPassword(email) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      return response.ok;
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  }

  async updatePassword(token, newPassword) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/update-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword }),
      });

      return response.ok;
    } catch (error) {
      console.error("Password update error:", error);
      throw error;
    }
  }

  setSession(authResult) {
    this.token = authResult.token;
    this.user = authResult.user;
    localStorage.setItem("token", authResult.token);
    localStorage.setItem("user", JSON.stringify(authResult.user));
  }

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    this.token = null;
    this.user = null;
    window.location.href = "/login.html";
  }

  getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
  }
}

// Initialize auth instance
const auth = new Auth();

// Protect routes
if (
  document.location.pathname !== "/login.html" &&
  document.location.pathname !== "/register.html" &&
  !auth.isAuthenticated()
) {
  window.location.href = "/login.html";
}
