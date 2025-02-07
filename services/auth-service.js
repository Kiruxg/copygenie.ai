class AuthService {
  constructor() {
    this.baseUrl = "http://localhost:3000/api/auth";
    this.token = localStorage.getItem("authToken");
  }

  async register(email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      this.setToken(data.token);
      return data.user;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      this.setToken(data.token);
      return data.user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.href = "/login.html";
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem("authToken", token);
  }

  getToken() {
    return this.token;
  }

  isAuthenticated() {
    return !!this.token;
  }

  async getProfile() {
    try {
      const response = await fetch(`${this.baseUrl}/profile`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      return data.user;
    } catch (error) {
      console.error("Profile error:", error);
      throw error;
    }
  }
}
