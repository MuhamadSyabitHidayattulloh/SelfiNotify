// SelfiNotify Test Client - Main Application Logic
class SelfiNotifyTestClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.connectionStartTime = null;
    this.connectionTimer = null;
    this.notifications = [];
    this.settings = this.loadSettings();
    this.audioContext = null;
    this.audioBuffer = null;

    this.initializeApp();
  }

  initializeApp() {
    this.setupEventListeners();
    this.loadStoredNotifications();
    this.updateUI();
    this.log("Test client initialized", "info");

    // Request notification permission
    if (this.settings.desktopNotifications) {
      this.requestNotificationPermission();
    }
  }

  setupEventListeners() {
    // Connection controls
    document
      .getElementById("toggleConnectionBtn")
      .addEventListener("click", () => {
        if (this.isConnected) {
          this.disconnect();
        } else {
          this.connect();
        }
      });

    // Settings
    document.getElementById("settingsBtn").addEventListener("click", () => {
      this.showSettingsModal();
    });

    document
      .getElementById("closeSettingsBtn")
      .addEventListener("click", () => {
        this.hideSettingsModal();
      });

    document.getElementById("saveSettingsBtn").addEventListener("click", () => {
      this.saveSettings();
    });

    // Notification controls
    document.getElementById("clearAllBtn").addEventListener("click", () => {
      this.clearAllNotifications();
    });

    document.getElementById("exportBtn").addEventListener("click", () => {
      this.exportNotifications();
    });

    document.getElementById("clearLogBtn").addEventListener("click", () => {
      this.clearLog();
    });

    // Form inputs
    document.getElementById("serverUrl").addEventListener("input", () => {
      this.saveSettings();
    });

    document.getElementById("appToken").addEventListener("input", () => {
      this.saveSettings();
    });

    // Settings form
    document.getElementById("autoReconnect").addEventListener("change", () => {
      this.settings.autoReconnect =
        document.getElementById("autoReconnect").checked;
    });

    document.getElementById("soundEnabled").addEventListener("change", () => {
      this.settings.soundEnabled =
        document.getElementById("soundEnabled").checked;
    });

    document
      .getElementById("desktopNotifications")
      .addEventListener("change", () => {
        this.settings.desktopNotifications = document.getElementById(
          "desktopNotifications"
        ).checked;
        if (this.settings.desktopNotifications) {
          this.requestNotificationPermission();
        }
      });

    document
      .getElementById("notificationDuration")
      .addEventListener("input", () => {
        this.settings.notificationDuration = parseInt(
          document.getElementById("notificationDuration").value
        );
      });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "k":
            e.preventDefault();
            document.getElementById("appToken").focus();
            break;
          case "s":
            e.preventDefault();
            this.saveSettings();
            break;
          case "c":
            if (e.shiftKey) {
              e.preventDefault();
              this.clearAllNotifications();
            }
            break;
        }
      }
    });
  }

  async connect() {
    const serverUrl = document.getElementById("serverUrl").value.trim();
    const appToken = document.getElementById("appToken").value.trim();

    if (!serverUrl || !appToken) {
      this.showToast("Please enter both server URL and app token", "error");
      return;
    }

    try {
      this.log(`Connecting to ${serverUrl}...`, "info");
      this.updateConnectionStatus("connecting");

      // Create Socket.IO connection
      this.socket = io(serverUrl, {
        transports: ["websocket", "polling"],
        timeout: 10000,
        reconnection: this.settings.autoReconnect,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.setupSocketEventHandlers();

      // Authenticate with app token
      this.socket.emit("authenticate", { app_token: appToken });
    } catch (error) {
      this.log(`Connection failed: ${error.message}`, "error");
      this.updateConnectionStatus("disconnected");
      this.showToast("Connection failed", "error");
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.updateConnectionStatus("disconnected");
    this.stopConnectionTimer();
    this.log("Disconnected from server", "info");
  }

  setupSocketEventHandlers() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.log("Socket connected", "success");
      this.updateConnectionStatus("connected");
      this.startConnectionTimer();
    });

    this.socket.on("disconnect", () => {
      this.log("Socket disconnected", "warning");
      this.updateConnectionStatus("disconnected");
      this.stopConnectionTimer();
    });

    this.socket.on("connect_error", (error) => {
      this.log(`Connection error: ${error.message}`, "error");
      this.updateConnectionStatus("error");
    });

    this.socket.on("authenticated", (data) => {
      this.log(
        `Successfully authenticated for app: ${
          data.application?.name || "Unknown"
        }`,
        "success"
      );
      this.showToast(
        `Connected to ${data.application?.name || "Unknown"}`,
        "success"
      );
    });

    this.socket.on("auth_error", (data) => {
      this.log(`Authentication failed: ${data.message}`, "error");
      this.showToast("Authentication failed", "error");
      this.disconnect();
    });

    this.socket.on("notification", (data) => {
      this.handleNotification(data);
    });

    this.socket.on("pong", (data) => {
      this.log(`Ping response received at ${data.timestamp}`, "info");
    });
  }

  handleNotification(data) {
    const notification = {
      id: data.id || Date.now(),
      title: data.title || "No Title",
      message: data.message || "No Message",
      fileUrl: data.file_url || null,
      sentAt: data.sent_at || new Date().toISOString(),
      jobId: data.job_id || null,
      timestamp: new Date(),
    };

    // Add to notifications array
    this.notifications.unshift(notification);

    // Limit stored notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    // Save to localStorage
    this.saveNotifications();

    // Update UI
    this.updateNotificationsUI();
    this.updateStatistics();

    // Show toast notification
    this.showNotificationToast(notification);

    // Play sound if enabled
    if (this.settings.soundEnabled) {
      this.playNotificationSound();
    }

    // Show desktop notification if enabled
    if (this.settings.desktopNotifications) {
      this.showDesktopNotification(notification);
    }

    this.log(`Notification received: ${notification.title}`, "success");
  }

  showNotificationToast(notification) {
    const toast = document.createElement("div");
    toast.className =
      "bg-white border-l-4 border-blue-500 shadow-lg rounded-lg p-4 max-w-sm transform translate-x-full transition-transform duration-300";
    toast.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                    <i class="fas fa-bell text-blue-500 text-lg"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900">${this.escapeHtml(
                      notification.title
                    )}</p>
                    <p class="text-sm text-gray-600 mt-1">${this.escapeHtml(
                      notification.message
                    )}</p>
                    <p class="text-xs text-gray-400 mt-2">${new Date(
                      notification.sentAt
                    ).toLocaleTimeString()}</p>
                </div>
                <button class="text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

    const container = document.getElementById("toastContainer");
    container.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.remove("translate-x-full");
    }, 100);

    // Auto remove after duration
    setTimeout(() => {
      toast.classList.add("translate-x-full");
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300);
    }, this.settings.notificationDuration * 1000);
  }

  updateConnectionStatus(status) {
    const indicator = document.getElementById("statusIndicator");
    const statusText = document.getElementById("statusText");
    const connectionStatusText = document.getElementById(
      "connectionStatusText"
    );
    const toggleBtn = document.getElementById("toggleConnectionBtn");

    this.isConnected = status === "connected";

    switch (status) {
      case "connected":
        indicator.className = "w-3 h-3 bg-green-500 rounded-full pulse-ring";
        statusText.textContent = "Connected";
        connectionStatusText.textContent = "Online";
        toggleBtn.textContent = "Disconnect";
        toggleBtn.className =
          "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors";
        break;
      case "connecting":
        indicator.className =
          "w-3 h-3 bg-yellow-500 rounded-full animate-pulse";
        statusText.textContent = "Connecting...";
        connectionStatusText.textContent = "Connecting";
        toggleBtn.textContent = "Connecting...";
        toggleBtn.disabled = true;
        toggleBtn.className =
          "px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed";
        break;
      case "error":
        indicator.className = "w-3 h-3 bg-red-500 rounded-full";
        statusText.textContent = "Error";
        connectionStatusText.textContent = "Error";
        toggleBtn.textContent = "Retry";
        toggleBtn.disabled = false;
        toggleBtn.className =
          "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors";
        break;
      default:
        indicator.className = "w-3 h-3 bg-gray-400 rounded-full";
        statusText.textContent = "Disconnected";
        connectionStatusText.textContent = "Offline";
        toggleBtn.textContent = "Connect";
        toggleBtn.disabled = false;
        toggleBtn.className =
          "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors";
        break;
    }
  }

  startConnectionTimer() {
    this.connectionStartTime = Date.now();
    this.connectionTimer = setInterval(() => {
      this.updateConnectionTime();
    }, 1000);
  }

  stopConnectionTimer() {
    if (this.connectionTimer) {
      clearInterval(this.connectionTimer);
      this.connectionTimer = null;
    }
    this.connectionStartTime = null;
    document.getElementById("connectionTime").textContent = "00:00";
  }

  updateConnectionTime() {
    if (this.connectionStartTime) {
      const elapsed = Date.now() - this.connectionStartTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      document.getElementById("connectionTime").textContent = `${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
  }

  updateNotificationsUI() {
    const container = document.getElementById("notificationsContainer");

    if (this.notifications.length === 0) {
      container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-bell-slash text-4xl mb-4"></i>
                    <p class="text-lg font-medium">No notifications yet</p>
                    <p class="text-sm">Connect to a SelfiNotify server to start receiving notifications</p>
                </div>
            `;
      return;
    }

    container.innerHTML = this.notifications
      .map(
        (notification, index) => `
            <div class="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500 hover:bg-gray-100 transition-colors slide-in" 
                 style="animation-delay: ${index * 0.1}s">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-2">
                            <h3 class="text-lg font-semibold text-gray-900">${this.escapeHtml(
                              notification.title
                            )}</h3>
                            ${
                              notification.jobId
                                ? `<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Job: ${notification.jobId}</span>`
                                : ""
                            }
                        </div>
                        <p class="text-gray-700 mb-3">${this.escapeHtml(
                          notification.message
                        )}</p>
                        ${
                          notification.fileUrl
                            ? `
                            <div class="mb-3">
                                <a href="${notification.fileUrl}" target="_blank" 
                                   class="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800">
                                    <i class="fas fa-paperclip"></i>
                                    <span>View Attachment</span>
                                </a>
                            </div>
                        `
                            : ""
                        }
                        <div class="flex items-center space-x-4 text-sm text-gray-500">
                            <span><i class="fas fa-clock mr-1"></i>${new Date(
                              notification.sentAt
                            ).toLocaleString()}</span>
                            <span><i class="fas fa-id mr-1"></i>${
                              notification.id
                            }</span>
                        </div>
                    </div>
                    <button onclick="testClient.deleteNotification(${index})" 
                            class="text-gray-400 hover:text-red-600 transition-colors p-1">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `
      )
      .join("");
  }

  updateStatistics() {
    document.getElementById("totalNotifications").textContent =
      this.notifications.length;

    const today = new Date().toDateString();
    const todayCount = this.notifications.filter(
      (n) => new Date(n.sentAt).toDateString() === today
    ).length;
    document.getElementById("todayNotifications").textContent = todayCount;
  }

  deleteNotification(index) {
    this.notifications.splice(index, 1);
    this.saveNotifications();
    this.updateNotificationsUI();
    this.updateStatistics();
    this.log(`Notification deleted`, "info");
  }

  clearAllNotifications() {
    if (this.notifications.length === 0) return;

    if (confirm("Are you sure you want to delete all notifications?")) {
      this.notifications = [];
      this.saveNotifications();
      this.updateNotificationsUI();
      this.updateStatistics();
      this.log("All notifications cleared", "info");
      this.showToast("All notifications cleared", "success");
    }
  }

  exportNotifications() {
    if (this.notifications.length === 0) {
      this.showToast("No notifications to export", "warning");
      return;
    }

    const data = {
      exportDate: new Date().toISOString(),
      totalNotifications: this.notifications.length,
      notifications: this.notifications,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notifications-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.log("Notifications exported", "info");
    this.showToast("Notifications exported successfully", "success");
  }

  showSettingsModal() {
    document.getElementById("settingsModal").classList.remove("hidden");

    // Populate form with current settings
    document.getElementById("autoReconnect").checked =
      this.settings.autoReconnect;
    document.getElementById("soundEnabled").checked =
      this.settings.soundEnabled;
    document.getElementById("desktopNotifications").checked =
      this.settings.desktopNotifications;
    document.getElementById("notificationDuration").value =
      this.settings.notificationDuration;
  }

  hideSettingsModal() {
    document.getElementById("settingsModal").classList.add("hidden");
  }

  saveSettings() {
    this.settings.serverUrl = document.getElementById("serverUrl").value;
    this.settings.appToken = document.getElementById("appToken").value;

    localStorage.setItem("selfinotify_settings", JSON.stringify(this.settings));
    this.log("Settings saved", "info");
    this.showToast("Settings saved", "success");
  }

  loadSettings() {
    const defaultSettings = {
      serverUrl: "http://localhost:3000",
      appToken: "",
      autoReconnect: true,
      soundEnabled: true,
      desktopNotifications: false,
      notificationDuration: 5,
    };

    try {
      const stored = localStorage.getItem("selfinotify_settings");
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }

    return defaultSettings;
  }

  loadStoredNotifications() {
    try {
      const stored = localStorage.getItem("selfinotify_notifications");
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  }

  saveNotifications() {
    try {
      localStorage.setItem(
        "selfinotify_notifications",
        JSON.stringify(this.notifications)
      );
    } catch (error) {
      console.error("Failed to save notifications:", error);
    }
  }

  log(message, type = "info") {
    const logContainer = document.getElementById("logContainer");
    const timestamp = new Date().toLocaleTimeString();

    const logEntry = document.createElement("div");
    logEntry.className = `mb-2 ${this.getLogTypeClass(type)}`;
    logEntry.innerHTML = `
            <span class="text-gray-500">[${timestamp}]</span>
            <span class="ml-2">${this.escapeHtml(message)}</span>
        `;

    // Remove placeholder if exists
    const placeholder = logContainer.querySelector(
      ".text-gray-500.text-center"
    );
    if (placeholder) {
      placeholder.remove();
    }

    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;

    // Limit log entries
    const entries = logContainer.querySelectorAll("div");
    if (entries.length > 100) {
      entries[0].remove();
    }
  }

  getLogTypeClass(type) {
    switch (type) {
      case "error":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      case "success":
        return "text-green-600";
      default:
        return "text-gray-700";
    }
  }

  clearLog() {
    const logContainer = document.getElementById("logContainer");
    logContainer.innerHTML = `
            <div class="text-gray-500 text-center py-8">
                <i class="fas fa-terminal text-2xl mb-2"></i>
                <p>Connection log will appear here</p>
            </div>
        `;
  }

  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg text-white transition-all duration-300 ${this.getToastTypeClass(
      type
    )}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.add("opacity-100");
    }, 100);

    // Auto remove
    setTimeout(() => {
      toast.classList.add("opacity-0");
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300);
    }, 3000);
  }

  getToastTypeClass(type) {
    switch (type) {
      case "error":
        return "bg-red-600 opacity-0";
      case "warning":
        return "bg-yellow-600 opacity-0";
      case "success":
        return "bg-green-600 opacity-0";
      default:
        return "bg-blue-600 opacity-0";
    }
  }

  async requestNotificationPermission() {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        this.log("Desktop notifications enabled", "success");
      } else {
        this.log("Desktop notifications denied", "warning");
        this.settings.desktopNotifications = false;
        document.getElementById("desktopNotifications").checked = false;
      }
    }
  }

  showDesktopNotification(notification) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
        tag: notification.id,
        requireInteraction: false,
      });
    }
  }

  async playNotificationSound() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
      }

      if (!this.audioBuffer) {
        // Create a simple notification sound
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.3;
        const frequency = 800;

        this.audioBuffer = this.audioContext.createBuffer(
          1,
          sampleRate * duration,
          sampleRate
        );
        const data = this.audioBuffer.getChannelData(0);

        for (let i = 0; i < sampleRate * duration; i++) {
          data[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * 0.3;
        }
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = this.audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();
    } catch (error) {
      console.error("Failed to play notification sound:", error);
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  updateUI() {
    // Apply stored settings to UI
    document.getElementById("serverUrl").value = this.settings.serverUrl;
    document.getElementById("appToken").value = this.settings.appToken;

    // Update statistics
    this.updateStatistics();
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.testClient = new SelfiNotifyTestClient();
});

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // Page is hidden, pause connection timer
    if (window.testClient && window.testClient.connectionTimer) {
      clearInterval(window.testClient.connectionTimer);
    }
  } else {
    // Page is visible, resume connection timer
    if (
      window.testClient &&
      window.testClient.isConnected &&
      window.testClient.connectionStartTime
    ) {
      window.testClient.startConnectionTimer();
    }
  }
});

// Handle beforeunload
window.addEventListener("beforeunload", () => {
  if (window.testClient && window.testClient.socket) {
    window.testClient.socket.disconnect();
  }
});

