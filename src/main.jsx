import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
          background: "#141414",
          color: "#fff",
          padding: "20px",
          textAlign: "center",
        }}>
          <h2 style={{ fontSize: "22px", marginBottom: "8px", fontWeight: 700 }}>Bússola — Gestão de Feedback</h2>
          <p style={{ color: "#FF8C47", fontSize: "13.5px", maxWidth: "480px", marginBottom: "16px", background: "#242424", padding: "10px 14px", borderRadius: "8px" }}>
            {this.state.error ? this.state.error.toString() : "Sessão encerrada com sucesso."}
          </p>
          <button
            onClick={() => {
              try {
                localStorage.clear();
                sessionStorage.clear();
              } catch (e) {}
              window.location.href = window.location.origin + window.location.pathname;
            }}
            style={{
              padding: "11px 24px",
              background: "#FF6F1F",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(255,111,31,0.3)",
            }}
          >
            Voltar para a Tela Inicial de Login
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
