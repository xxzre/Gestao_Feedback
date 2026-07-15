import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
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
          <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Recarregando sistema...</h2>
          <p style={{ color: "#888", fontSize: "14px", marginBottom: "20px" }}>Ocorreu uma transição temporária no estado.</p>
          <button
            onClick={() => {
              localStorage.removeItem("disc_currentUser");
              window.location.reload();
            }}
            style={{
              padding: "10px 20px",
              background: "#FF6F1F",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Voltar para a página inicial
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
