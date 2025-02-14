class AuthService {
  constructor() {
    this.baseUrl = "http://localhost:3000/auth";
  }

  loginWithGoogle() {
    window.location.href = `${this.baseUrl}/google`;
  }

  isAuthenticated() {
    // Check if user is in session (cookie-based)
    return fetch(`${this.baseUrl}/check`, {
      credentials: "include",
    })
      .then((res) => res.ok)
      .catch(() => false);
  }
}

export default new AuthService();
