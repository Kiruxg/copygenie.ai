class WebSocketManager {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Set();
  }

  connect(userId) {
    const wsUrl = `${process.env.REACT_APP_WS_URL}/notifications?userId=${userId}`;
    this.socket = new WebSocket(wsUrl);

    this.socket.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      this.notifyListeners(notification);
    };

    this.socket.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect(userId);
        }, 1000 * Math.pow(2, this.reconnectAttempts));
      }
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(notification) {
    this.listeners.forEach((callback) => callback(notification));
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.listeners.clear();
    this.reconnectAttempts = 0;
  }
}

export default new WebSocketManager();
