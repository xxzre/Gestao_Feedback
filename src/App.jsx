import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  MessageSquareText,
  CalendarClock,
  Compass as CompassIcon,
  LogOut,
  Plus,
  X,
  Check,
  ChevronRight,
  UserCircle2,
  Send,
  ShieldCheck,
  Sparkles,
  BookOpen,
} from "lucide-react";
import feed1 from "./feed1.jpeg";
import feed2 from "./feed2.jpeg";
import feed3 from "./feed3.jpeg";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { db, isFirebaseConfigured, auth } from "./firebase";

/* ---------------------------------------------------------------------- */
/*  Tokens                                                                 */
/* ---------------------------------------------------------------------- */
// GOL Brand Palette
const GOL_ORANGE = "#FF6F1F";
const GOL_ORANGE_DARK = "#D95A10";
const GOL_ORANGE_LIGHT = "#FF8C47";
const GOL_BLACK = "#111111";
const GOL_DARK = "#1A1A1A";
const GOL_SIDEBAR = "#141414";
const GOL_SIDEBAR_HOVER = "#242424";

// Semantic aliases (keeping old names for backward compat)
const INK = "#1A1A1A";
const PAPER = "#F0F2F5";
const PAPER_RAISED = "#FFFFFF";
const LINE = "#E8E8E8";
const NAVY = GOL_ORANGE;
const NAVY_SOFT = "#888888";

const DISC_INFO = {
  D: { nome: "Dominância", cor: "#B23A2E", desc: "Direto, decidido e orientado a resultados. Prefere autonomia, ritmo acelerado e desafios concretos." },
  I: { nome: "Influência", cor: "#C8952B", desc: "Comunicativo, entusiasta e persuasivo. Motiva pessoas e constrói relações com facilidade." },
  S: { nome: "Estabilidade", cor: "#3F7A5E", desc: "Paciente, leal e colaborativo. Valoriza consistência, cooperação e ambientes previsíveis." },
  C: { nome: "Conformidade", cor: "#35577A", desc: "Analítico, preciso e organizado. Busca qualidade, dados e processos bem definidos." },
};

const DISC_BLOCKS = [
  { D: "Decidido", I: "Entusiasmado", S: "Paciente", C: "Cauteloso" },
  { D: "Direto", I: "Sociável", S: "Constante", C: "Preciso" },
  { D: "Competitivo", I: "Persuasivo", S: "Leal", C: "Analítico" },
  { D: "Ousado", I: "Expressivo", S: "Calmo", C: "Organizado" },
  { D: "Assertivo", I: "Otimista", S: "Cooperativo", C: "Detalhista" },
  { D: "Independente", I: "Comunicativo", S: "Previsível", C: "Criterioso" },
  { D: "Exigente", I: "Espontâneo", S: "Gentil", C: "Sistemático" },
  { D: "Determinado", I: "Envolvente", S: "Discreto", C: "Meticuloso" },
  { D: "Impaciente", I: "Animado", S: "Tolerante", C: "Formal" },
  { D: "Firme", I: "Carismático", S: "Estável", C: "Reservado" },
  { D: "Enérgico", I: "Falante", S: "Consistente", C: "Rigoroso" },
  { D: "Confiante", I: "Popular", S: "Tranquilo", C: "Prudente" },
];

const FEEDBACK_TIPOS = [
  { id: "reconhecimento", label: "Reconhecimento", cor: "#3F7A5E" },
  { id: "desenvolvimento", label: "Desenvolvimento", cor: "#C8952B" },
  { id: "alinhamento", label: "Alinhamento", cor: "#35577A" },
];

/* ---------------------------------------------------------------------- */
/*  Helpers                                                                */
/* ---------------------------------------------------------------------- */
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const fmtData = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

/* ---------------------------------------------------------------------- */
/*  Compass — signature DISC visual                                       */
/* ---------------------------------------------------------------------- */
function Compass({ scores, size = 200 }) {
  const c = size / 2;
  const maxR = size * 0.42;
  const baseHalf = size * 0.045;

  const needle = (angleDeg, value, color, label) => {
    const rad = (angleDeg * Math.PI) / 180;
    const len = size * 0.14 + (value / 100) * maxR;
    const tip = [c + len * Math.cos(rad), c + len * Math.sin(rad)];
    const p1 = [
      c + baseHalf * Math.cos(rad - Math.PI / 2),
      c + baseHalf * Math.sin(rad - Math.PI / 2),
    ];
    const p2 = [
      c + baseHalf * Math.cos(rad + Math.PI / 2),
      c + baseHalf * Math.sin(rad + Math.PI / 2),
    ];
    const labelPos = [
      c + (len + 16) * Math.cos(rad),
      c + (len + 16) * Math.sin(rad),
    ];
    return (
      <g key={label}>
        <polygon
          points={`${p1.join(",")} ${tip.join(",")} ${p2.join(",")}`}
          fill={color}
          opacity="0.92"
        />
        <text
          x={labelPos[0]}
          y={labelPos[1]}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="IBM Plex Mono, monospace"
          fontSize={size * 0.06}
          fontWeight="600"
          fill={INK}
        >
          {label}
        </text>
      </g>
    );
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.2, 0.4, 0.6, 0.8, 1].map((f) => (
        <circle
          key={f}
          cx={c}
          cy={c}
          r={maxR * f}
          fill="none"
          stroke={LINE}
          strokeWidth="1"
        />
      ))}
      <line x1={c} y1={c - maxR - 14} x2={c} y2={c + maxR + 14} stroke={LINE} strokeWidth="1" />
      <line x1={c - maxR - 14} y1={c} x2={c + maxR + 14} y2={c} stroke={LINE} strokeWidth="1" />
      {needle(-90, scores.D, DISC_INFO.D.cor, "D")}
      {needle(0, scores.I, DISC_INFO.I.cor, "I")}
      {needle(90, scores.S, DISC_INFO.S.cor, "S")}
      {needle(180, scores.C, DISC_INFO.C.cor, "C")}
      <circle cx={c} cy={c} r={size * 0.02} fill={INK} />
    </svg>
  );
}

function MiniCompass({ scores }) {
  return <Compass scores={scores} size={72} />;
}

/* ---------------------------------------------------------------------- */
/*  Shared bits                                                           */
/* ---------------------------------------------------------------------- */
function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: PAPER_RAISED,
        border: `1px solid ${LINE}`,
        borderRadius: "10px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Button({ children, onClick, variant = "primary", type = "button", disabled, style = {} }) {
  const base = {
    fontFamily: "Inter, sans-serif",
    fontSize: "13.5px",
    fontWeight: 600,
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: disabled ? "not-allowed" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    border: "1px solid transparent",
    opacity: disabled ? 0.5 : 1,
    transition: "all .15s ease",
    letterSpacing: "0.01em",
  };
  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${GOL_ORANGE}, ${GOL_ORANGE_DARK})`,
      color: "#fff",
      boxShadow: `0 4px 14px ${GOL_ORANGE}44`,
    },
    ghost: {
      background: "transparent",
      color: GOL_ORANGE,
      border: `1.5px solid ${GOL_ORANGE}`,
    },
    danger: {
      background: "transparent",
      color: "#E53935",
      border: `1px solid #E5393533`,
    },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.filter = "brightness(1.08)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = ""; }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: "16px" }}>
      <span
        style={{
          display: "block",
          fontFamily: "Inter, sans-serif",
          fontSize: "11.5px",
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: NAVY_SOFT,
          fontWeight: 600,
          marginBottom: "7px",
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  padding: "11px 14px",
  border: `1.5px solid ${LINE}`,
  borderRadius: "8px",
  background: "#fff",
  color: INK,
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color .2s",
};

function Badge({ children, color }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: "Inter, sans-serif",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        padding: "3px 10px",
        borderRadius: "20px",
        color: "#fff",
        background: color,
      }}
    >
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------------- */
/*  Auth screens                                                          */
/* ---------------------------------------------------------------------- */
function AuthScreen({ users, onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [role, setRole] = useState("colaborador");
  const [gestorId, setGestorId] = useState("");

  const gestores = users.filter((u) => u.role === "gestor");

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = username.trim().toLowerCase();
    if (!email || !password) {
      setError("Preencha usuário/e-mail e senha.");
      return;
    }
    setError("");
    
    if (isFirebaseConfigured) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // O onAuthStateChanged tratará o set do currentUser
      } catch (err) {
        console.error(err);
        setError("Erro ao entrar: " + (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password" ? "Usuário ou senha incorretos." : err.message));
      }
    } else {
      const u = users.find((x) => x.username === email);
      if (!u || u.password !== password) {
        setError("Usuário ou senha incorretos.");
        return;
      }
      onLogin(u);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const email = username.trim().toLowerCase();
    if (!email || !password || !nome.trim()) {
      setError("Preencha nome, usuário/e-mail e senha.");
      return;
    }
    if (isFirebaseConfigured && !email.includes("@")) {
      setError("Insira um e-mail válido (exemplo: seu@email.com).");
      return;
    }
    if (role === "colaborador" && gestores.length > 0 && !gestorId) {
      setError("Selecione o gestor responsável.");
      return;
    }
    setError("");

    if (isFirebaseConfigured) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        const novo = {
          email: email,
          name: nome.trim(),
          role: gestores.length === 0 ? "gestor" : role,
          gestorId: role === "colaborador" ? gestorId : null,
        };
        // Salva dados adicionais no Firestore sem a senha
        await setDoc(doc(db, "users", uid), novo);
      } catch (err) {
        console.error(err);
        setError("Erro ao cadastrar: " + (err.code === "auth/email-already-in-use" ? "Este e-mail já está em uso." : err.message));
      }
    } else {
      if (users.some((x) => x.username === email)) {
        setError("Esse usuário já existe.");
        return;
      }
      const novo = {
        id: uid(),
        username: email,
        password,
        name: nome.trim(),
        role: gestores.length === 0 ? "gestor" : role,
        gestorId: role === "colaborador" ? gestorId : null,
      };
      onRegister(novo);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "Inter, sans-serif",
        color: INK,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        input:focus, select:focus { border-color: ${GOL_ORANGE} !important; box-shadow: 0 0 0 3px ${GOL_ORANGE}22 !important; }
      `}</style>

      {/* LEFT PANEL – Branding */}
      <div style={{
        flex: "0 0 42%",
        background: GOL_SIDEBAR,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "48px 48px 40px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "340px", height: "340px", borderRadius: "50%", background: `${GOL_ORANGE}18`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-60px", left: "-60px", width: "260px", height: "260px", borderRadius: "50%", background: `${GOL_ORANGE}12`, pointerEvents: "none" }} />

        {/* Logo / brand */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "56px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: GOL_ORANGE, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CompassIcon size={20} color="#fff" />
            </div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "17px", letterSpacing: "0.01em" }}>Bússola de Pessoas</span>
          </div>

          <h1 style={{ color: "#fff", fontWeight: 800, fontSize: "36px", lineHeight: 1.15, margin: "0 0 18px 0" }}>
            Gestão de<br />
            <span style={{ color: GOL_ORANGE }}>Feedback & DISC</span>
          </h1>
          <p style={{ color: "#aaa", fontSize: "14.5px", lineHeight: 1.65, margin: 0, maxWidth: "320px" }}>
            Histórico de feedback, agenda de conversas e perfil comportamental — tudo em um só lugar para sua equipe.
          </p>

          <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "14px" }}>
            {[
              { icon: "🎯", text: "Feedback estruturado por perfil DISC" },
              { icon: "📅", text: "Agenda de conversas 1:1" },
              { icon: "🧭", text: "Teste DISC integrado e automático" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "18px" }}>{item.icon}</span>
                <span style={{ color: "#ccc", fontSize: "13.5px" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: "#555", fontSize: "12px", margin: 0 }}>
          © 2026 GOL Linhas Aéreas · Gestão de Pessoas
        </p>
      </div>

      {/* RIGHT PANEL – Form */}
      <div style={{
        flex: 1,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 32px",
      }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <h2 style={{ fontWeight: 800, fontSize: "26px", margin: "0 0 4px 0" }}>
            {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
          </h2>
          <p style={{ color: NAVY_SOFT, fontSize: "14px", margin: "0 0 28px 0" }}>
            {mode === "login" ? "Entre com suas credenciais para continuar." : "Preencha os dados para acessar o sistema."}
          </p>

          {/* Tab switcher */}
          <div style={{ display: "flex", gap: "0", marginBottom: "28px", background: PAPER, borderRadius: "10px", padding: "4px" }}>
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1,
                  background: mode === m ? "#fff" : "transparent",
                  border: "none",
                  padding: "9px 0",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  color: mode === m ? INK : NAVY_SOFT,
                  borderRadius: "8px",
                  cursor: "pointer",
                  boxShadow: mode === m ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
                  transition: "all .2s",
                }}
              >
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin}>
              <Field label="E-mail">
                <input style={inputStyle} value={username} onChange={(e) => setUsername(e.target.value)} autoFocus placeholder="seu@email.com" />
              </Field>
              <Field label="Senha">
                <input type="password" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </Field>
              {error && <p style={{ color: "#E53935", fontSize: "13px", marginTop: "-8px", marginBottom: "12px" }}>{error}</p>}
              <Button type="submit" style={{ width: "100%", justifyContent: "center", marginTop: "6px", padding: "13px 20px", fontSize: "14px" }}>
                <ShieldCheck size={16} /> Entrar na plataforma
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <Field label="Nome completo">
                <input style={inputStyle} value={nome} onChange={(e) => setNome(e.target.value)} autoFocus placeholder="Seu nome completo" />
              </Field>
              <Field label="E-mail">
                <input style={inputStyle} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="seu@email.com" />
              </Field>
              <Field label="Senha">
                <input type="password" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </Field>
              {gestores.length > 0 && (
                <Field label="Papel">
                  <div style={{ display: "flex", gap: "8px" }}>
                    {["colaborador", "gestor", "admin"].map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRole(r)}
                        style={{
                          flex: 1,
                          padding: "10px 0",
                          borderRadius: "8px",
                          border: `1.5px solid ${role === r ? GOL_ORANGE : LINE}`,
                          background: role === r ? GOL_ORANGE : "#fff",
                          color: role === r ? "#fff" : INK,
                          fontFamily: "Inter, sans-serif",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all .2s",
                        }}
                      >
                        {r === "colaborador" ? "Colaborador" : r === "gestor" ? "Gestor" : "Admin"}
                      </button>
                    ))}
                  </div>
                </Field>
              )}
              {gestores.length === 0 && (
                <div style={{ fontSize: "12.5px", color: NAVY_SOFT, background: "#FFF5F0", border: `1px solid ${GOL_ORANGE}44`, padding: "12px 14px", borderRadius: "8px", marginBottom: "16px" }}>
                  Ainda não há nenhum gestor cadastrado — esta primeira conta será criada como <b>Gestor</b>.
                </div>
              )}
              {role === "colaborador" && gestores.length > 0 && (
                <Field label="Seu gestor">
                  <select style={inputStyle} value={gestorId} onChange={(e) => setGestorId(e.target.value)}>
                    <option value="">Selecione…</option>
                    {gestores.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </Field>
              )}
              {error && <p style={{ color: "#E53935", fontSize: "13px", marginTop: "-8px", marginBottom: "12px" }}>{error}</p>}
              <Button type="submit" style={{ width: "100%", justifyContent: "center", marginTop: "6px", padding: "13px 20px", fontSize: "14px" }}>
                <Sparkles size={16} /> Criar minha conta
              </Button>
            </form>
          )}

          <p style={{ fontSize: "11.5px", color: "#bbb", marginTop: "24px", lineHeight: 1.5, textAlign: "center" }}>
            Os dados ficam salvos no Firestore, compartilhados em tempo real entre todos os usuários.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Dashboard                                                              */
/* ---------------------------------------------------------------------- */
function StatCard({ label, value, accent }) {
  return (
    <Card style={{ padding: "18px 20px", flex: 1, minWidth: "150px" }}>
      <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: NAVY_SOFT }}>
        {label}
      </div>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: "34px", fontWeight: 600, color: accent || INK, marginTop: "6px" }}>
        {value}
      </div>
    </Card>
  );
}

function Dashboard({ user, users, feedbacks, agenda, discResults, goTo }) {
  const isAdmin = user?.role === "admin";
  const isGestor = user?.role === "gestor" || user?.role === "admin";
  const userId = user?.id || "";
        {isAdmin ? "Painel Administrativo" : ("Ola, " + firstName)}

  const equipe = isAdmin ? users.filter((u) => u.role === "colaborador") : users.filter((u) => u.gestorId === userId);
  const meusFeedbacks = isAdmin ? feedbacks : feedbacks.filter((f) => f.autorId === userId || f.destinatarioId === userId);
  const proximos = agenda
    .filter((a) => (isAdmin ? true : isGestor ? a.gestorId === userId : a.colaboradorId === userId) && a.status === "Agendado")
    .sort((a, b) => ((a.data || "") + (a.hora || "")).localeCompare((b.data || "") + (b.hora || "")))
    .slice(0, 4);
        {isAdmin ? "Painel Administrativo" : ("Ola, " + firstName)}
      </h2>
      <p style={{ color: NAVY_SOFT, fontSize: "14px", margin: "0 0 22px 0" }}>
        {isAdmin ? "Visao completa de toda a empresa." : isGestor ? "Panorama da sua equipe hoje." : "Seu panorama de desenvolvimento."}
      </p>
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "22px" }}>
        {isAdmin ? (
          <>
            <StatCard label="Colaboradores" value={users.filter((u) => u.role === "colaborador").length} />
            <StatCard label="Gestores" value={users.filter((u) => u.role === "gestor").length} accent="#35577A" />
            <StatCard label="Feedbacks totais" value={feedbacks.length} accent="#3F7A5E" />
            <StatCard label="Agendamentos" value={agenda.filter((a) => a.status === "Agendado").length} accent="#C8952B" />
          </>
        ) : isGestor ? (
          <>
            <StatCard label="Colaboradores" value={equipe.length} />
            <StatCard label="Feedbacks dados" value={feedbacks.filter((f) => f.autorId === user.id).length} accent="#3F7A5E" />
            <StatCard label="Agendados" value={agenda.filter((a) => a.gestorId === user.id && a.status === "Agendado").length} accent="#C8952B" />
          </>
        ) : (
          <>
            <StatCard label="Feedbacks recebidos" value={feedbacks.filter((f) => f.destinatarioId === user.id).length} />
            <StatCard label="Agendados" value={agenda.filter((a) => a.colaboradorId === user.id && a.status === "Agendado").length} accent="#C8952B" />
            <StatCard label="Teste DISC" value={discResults[user.id] ? "Concluido" : "Pendente"} accent={discResults[user.id] ? "#3F7A5E" : "#B23A2E"} />
          </>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "16px" }} className="dash-grid">
        <Card style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "18px", margin: 0 }}>Próximas conversas</h3>
            <button onClick={() => goTo("agenda")} style={{ background: "none", border: "none", color: NAVY, fontSize: "12.5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
              Ver agenda <ChevronRight size={14} />
            </button>
          </div>
          {proximos.length === 0 ? (
            <p style={{ color: NAVY_SOFT, fontSize: "13.5px" }}>Nada agendado por enquanto.</p>
          ) : (
            proximos.map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${LINE}` }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>{a.titulo}</div>
                  <div style={{ fontSize: "12.5px", color: NAVY_SOFT }}>
                    {isGestor ? users.find((u) => u.id === a.colaboradorId)?.name : users.find((u) => u.id === a.gestorId)?.name}
                  </div>
                </div>
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "12.5px", color: NAVY_SOFT, textAlign: "right" }}>
                  {fmtData(a.data)}
                  <br />
                  {a.hora}
                </div>
              </div>
            ))
          )}
        </Card>

        <Card style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "18px", margin: 0 }}>Histórico recente</h3>
            <button onClick={() => goTo("feedbacks")} style={{ background: "none", border: "none", color: NAVY, fontSize: "12.5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
              Ver tudo <ChevronRight size={14} />
            </button>
          </div>
          {meusFeedbacks.length === 0 ? (
            <p style={{ color: NAVY_SOFT, fontSize: "13.5px" }}>Nenhum feedback registrado ainda.</p>
          ) : (
            meusFeedbacks
              .sort((a, b) => b.criadoEm - a.criadoEm)
              .slice(0, 4)
              .map((f) => {
                const tipo = FEEDBACK_TIPOS.find((t) => t.id === f.tipo) || FEEDBACK_TIPOS[0];
                return (
                  <div key={f.id} style={{ padding: "10px 0", borderBottom: `1px solid ${LINE}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <Badge color={tipo.cor}>{tipo.label}</Badge>
                      <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "11.5px", color: NAVY_SOFT }}>{fmtData(f.data)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "13.5px", color: INK, lineHeight: 1.4 }}>
                      {f.texto.length > 110 ? f.texto.slice(0, 110) + "…" : f.texto}
                    </p>
                  </div>
                );
              })
          )}
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Colaboradores (gestor)                                                 */
/* ---------------------------------------------------------------------- */
function ColaboradoresPage({ user, users, discResults }) {
  const isAdmin = user.role === "admin";
  const equipe = isAdmin ? users.filter((u) => u.role === "colaborador") : users.filter((u) => u.gestorId === user.id);
  return (
    <div>
      <h2 style={{ fontFamily: "Fraunces, serif", fontSize: "26px", fontWeight: 600, margin: "0 0 4px 0" }}>Colaboradores</h2>
      <p style={{ color: NAVY_SOFT, fontSize: "14px", margin: "0 0 22px 0" }}>Sua equipe e o perfil comportamental de cada pessoa.</p>
      {equipe.length === 0 ? (
        <Card style={{ padding: "28px", textAlign: "center", color: NAVY_SOFT }}>
          Ainda não há colaboradores vinculados a você. Peça para eles se cadastrarem escolhendo você como gestor.
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
          {equipe.map((c) => {
            const res = discResults[c.id];
            return (
              <Card key={c.id} style={{ padding: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <UserCircle2 size={30} color={NAVY_SOFT} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "15px" }}>{c.name}</div>
                    <div style={{ fontSize: "12px", color: NAVY_SOFT }}>@{c.username}</div>
                  </div>
                </div>
                {res ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <MiniCompass scores={res.resultado} />
                    <div>
                      <Badge color={DISC_INFO[res.dominante].cor}>{res.dominante} · {DISC_INFO[res.dominante].nome}</Badge>
                      <p style={{ fontSize: "12px", color: NAVY_SOFT, margin: "8px 0 0 0", lineHeight: 1.4 }}>{DISC_INFO[res.dominante].desc}</p>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: "12.5px", color: "#B23A2E", margin: 0 }}>Ainda não fez o teste DISC.</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
/* ---------------------------------------------------------------------- */
/*  Gestores (admin)                                                       */
/* ---------------------------------------------------------------------- */
function GestoresPage({ users, discResults, feedbacks }) {
  const gestores = users.filter((u) => u.role === "gestor");
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #FF6F1F, #D95A10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShieldCheck size={18} color="#fff" />
        </div>
        <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: "24px", fontWeight: 800, margin: 0 }}>Gestores</h2>
      </div>
      <p style={{ color: "#888", fontSize: "14px", margin: "0 0 24px 0" }}>Visao geral de todos os gestores e suas equipes.</p>
      {gestores.length === 0 ? (
        <Card style={{ padding: "28px", textAlign: "center", color: "#888" }}>Nenhum gestor cadastrado ainda.</Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {gestores.map((g) => {
            const equipe = users.filter((u) => u.gestorId === g.id);
            const fbCount = feedbacks.filter((f) => f.autorId === g.id).length;
            return (
              <Card key={g.id} style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: equipe.length > 0 ? "16px" : "0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #FF6F1F, #D95A10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: "15px" }}>{g.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "15px" }}>{g.name}</div>
                      <div style={{ fontSize: "12px", color: "#888" }}>{g.email || g.username || ""}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <span style={{ background: "#FFF5F0", color: "#FF6F1F", border: "1px solid #FF6F1F33", fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px" }}>{equipe.length} colaborador{equipe.length !== 1 ? "es" : ""}</span>
                    <span style={{ background: "#F0FAF5", color: "#3F7A5E", border: "1px solid #3F7A5E33", fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px" }}>{fbCount} feedback{fbCount !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                {equipe.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
                    {equipe.map((col) => {
                      const res = discResults[col.id];
                      return (
                        <div key={col.id} style={{ background: "#F8F8F8", borderRadius: "8px", padding: "10px 12px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <UserCircle2 size={20} color="#888" />
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 600 }}>{col.name}</div>
                            {res && <Badge color={DISC_INFO[res.dominante].cor}>{res.dominante}</Badge>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


/* ---------------------------------------------------------------------- */
/*  Guia DISC (gestor) - Sub-abas                                          */
/* ---------------------------------------------------------------------- */
function PerguntasSubTab() {
  const perguntas = [
    {
      num: "1",
      emoji: "🌟",
      pergunta: "O que você acha que está fazendo muito bem atualmente?",
      explicacao: "Valoriza os pontos fortes e aumenta a confiança."
    },
    {
      num: "2",
      emoji: "🔍",
      pergunta: "Em quais pontos você acredita que pode melhorar?",
      explicacao: "Estimula autoconhecimento antes mesmo da sua percepção."
    },
    {
      num: "3",
      emoji: "📊",
      pergunta: "O que está te impedindo hoje de performar melhor?",
      explicacao: "Identifica barreiras reais (processos, ferramentas, ambiente, etc.)."
    },
    {
      num: "4",
      emoji: "🎯",
      pergunta: "Quais são seus objetivos de desenvolvimento no curto prazo?",
      explicacao: "Conecta o feedback com crescimento e plano de ação."
    },
    {
      num: "5",
      emoji: "🤝",
      pergunta: "Como posso te apoiar melhor no seu desenvolvimento?",
      explicacao: "Mostra liderança, parceria e abre espaço para ajustes na gestão."
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {perguntas.map((p) => (
        <Card key={p.num} style={{ padding: "18px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>{p.emoji}</span>
            <div>
              <h4 style={{ fontFamily: "Fraunces, serif", fontSize: "16px", margin: "0 0 6px 0", color: NAVY }}>
                {p.num}. {p.pergunta}
              </h4>
              <p style={{ margin: 0, fontSize: "13.5px", color: INK, display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#3F7A5E", fontWeight: "bold" }}>👉</span> {p.explicacao}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function DevolucaoSubTab() {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const templates = [
    {
      titulo: "Modelo 1: Registro de Feedback – Colaborador (Autoavaliação)",
      texto: `Registro de Feedback – Colaborador

1. Pontos Fortes (Autoavaliação):
O colaborador destaca como principais pontos fortes: [resumo objetivo das respostas].
Percepção da liderança: Os pontos mencionados são consistentes com o desempenho apresentado, com destaque para [inserir exemplo prático ou comportamento observado].

2. Pontos de Desenvolvimento (Autoavaliação):
O colaborador identifica oportunidades de melhoria em: [resumo].
Percepção da liderança: Corroboro com os pontos levantados e acrescento a importância de desenvolver [se aplicável], visando aprimorar a performance e os resultados.

3. Desafios e Barreiras:
Foram apontados como principais desafios: [listar de forma clara].
Análise: Avaliar ações para mitigar os impactos, considerando ajustes de rotina, alinhamentos e suporte necessário.

4. Objetivos de Desenvolvimento:
O colaborador demonstra interesse em evoluir em: [resumo dos objetivos].
Direcionamento: Será estruturado um plano de desenvolvimento com foco em [competências/metas], com acompanhamento periódico para evolução contínua.

5. Suporte Necessário da Liderança:
O colaborador sinaliza necessidade de apoio em: [resumo].
Acordos estabelecidos: A liderança irá apoiar por meio de [ex: alinhamentos frequentes, direcionamentos, acompanhamento e/ou capacitação].

6. Encerramento:
O colaborador demonstra [ex: engajamento, responsabilidade, abertura ao aprendizado].
Reforço a importância da continuidade no desenvolvimento e acompanhamento das ações acordadas, visando evolução consistente e alinhamento aos objetivos da área.`
    },
    {
      titulo: "Modelo 2: Registro de Feedback – Colaborador (Percepção Geral)",
      texto: `Registro de Feedback – Colaborador

1. Pontos Fortes (Percepção do colaborador):
O colaborador destaca como principais pontos fortes: [resumir o que ele disse].
Validação da liderança: Reforço que esses pontos são percebidos no dia a dia, especialmente em [exemplo prático ou situação].

2. Pontos de Melhoria (Percepção do colaborador):
O colaborador reconhece a necessidade de desenvolvimento em: [resumir].
Complemento da liderança: Além disso, observo oportunidades de evolução em [se houver], principalmente em [impacto no trabalho].

3. Principais Barreiras Identificadas:
Foram mencionados como desafios: [listar obstáculos citados].
Ação proposta: Avaliar junto à liderança formas de minimizar esses impactos, como [ex: ajustes de processo, apoio técnico, treinamento].

4. Objetivos de Desenvolvimento:
O colaborador demonstrou interesse em desenvolver: [resumir objetivos].
Direcionamento: Alinhar um plano de ação com foco em [competência ou meta], com acompanhamento periódico.

5. Apoio da Liderança:
O colaborador sinalizou que precisa de suporte em: [resumir].
Compromisso da liderança: Ficou acordado que será oferecido apoio por meio de [ex: feedbacks mais frequentes, acompanhamento, capacitação, alinhamentos].

6. Considerações Finais:
O colaborador demonstra [ex: comprometimento, abertura ao desenvolvimento, engajamento].
Seguiremos acompanhando sua evolução com foco em melhoria contínua e alcance dos resultados esperados.`
    }
  ];

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {templates.map((t, idx) => (
        <Card key={idx} style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: `1px solid ${LINE}`, paddingBottom: "10px", flexWrap: "wrap", gap: "10px" }}>
            <h4 style={{ fontFamily: "Fraunces, serif", fontSize: "16px", margin: 0, color: NAVY }}>
              {t.titulo}
            </h4>
            <Button
              onClick={() => handleCopy(t.texto, idx)}
              variant="ghost"
              style={{ padding: "6px 12px", fontSize: "12px" }}
            >
              {copiedIndex === idx ? "Copiado!" : "Copiar Modelo"}
            </Button>
          </div>
          <pre style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            fontFamily: "IBM Plex Sans, sans-serif",
            fontSize: "13px",
            lineHeight: 1.6,
            color: INK,
            background: "#fff",
            padding: "14px",
            borderRadius: "4px",
            border: `1px solid ${LINE}`,
            maxHeight: "350px",
            overflowY: "auto"
          }}>
            {t.texto}
          </pre>
        </Card>
      ))}
    </div>
  );
}

function GuiaDiscPage() {
  const [activeSubTab, setActiveSubTab] = useState("perfis");

  const perfis = [
    {
      sigla: "D",
      nome: "Dominância",
      cor: DISC_INFO.D.cor,
      caract: "Foco em resultados, rapidez, competitividade e pragmatismo.",
      comoLidar: [
        "Seja direto, objetivo e vá direto ao ponto.",
        "Apresente soluções e resultados, não apenas problemas.",
        "Dê autonomia para tomada de decisões sempre que possível.",
        "Evite rodeios, microgestão ou ser excessivamente formal."
      ],
      feedback: "Deve ser factual, direto e focado em metas de desenvolvimento futuro."
    },
    {
      sigla: "I",
      nome: "Influência",
      cor: DISC_INFO.I.cor,
      caract: "Entusiasmo, otimismo, comunicação verbal e foco nas pessoas.",
      comoLidar: [
        "Crie uma atmosfera calorosa e amigável.",
        "Reconheça publicamente as suas ideias e contribuições.",
        "Ajude a estruturar metas e prazos com lembretes claros.",
        "Evite detalhes excessivamente técnicos ou burocráticos de início."
      ],
      feedback: "Comece com reconhecimento pessoal sincero e ajude a focar em 1 ou 2 pontos de melhoria práticos."
    },
    {
      sigla: "S",
      nome: "Estabilidade",
      cor: DISC_INFO.S.cor,
      caract: "Paciência, persistência, cooperação e escuta ativa.",
      comoLidar: [
        "Seja gentil, demonstre empatia e interesse genuíno pela pessoa.",
        "Dê previsibilidade e avise sobre mudanças com antecedência.",
        "Mostre como as ações dele impactam e ajudam a equipe.",
        "Evite pressões bruscas, impaciência ou conflitos desnecessários."
      ],
      feedback: "Crie um ambiente de apoio mútuo, dê tempo para processar e garanta que o relacionamento continua forte."
    },
    {
      sigla: "C",
      nome: "Conformidade",
      cor: DISC_INFO.C.cor,
      caract: "Precisão, foco em processos, qualidade e detalhismo técnico.",
      comoLidar: [
        "Forneça dados, regras claros e documentação precisa.",
        "Respeite o tempo necessário para análise detalhada.",
        "Seja lógico, organizado e evite abordagens puramente emocionais.",
        "Evite ser vago ou prometer coisas sem comprovação."
      ],
      feedback: "Deve ser altamente analítico, fundamentado em dados e métricas, focado na melhoria do processo."
    }
  ];

  return (
    <div>
      <h2 style={{ fontFamily: "Fraunces, serif", fontSize: "26px", fontWeight: 600, margin: "0 0 4px 0" }}>
        Como Lidar com cada Perfil (DISC)
      </h2>
      <p style={{ color: NAVY_SOFT, fontSize: "14px", margin: "0 0 22px 0" }}>
        Recursos para líderes: guias de perfil, perguntas chave para reuniões e modelos de devolução de feedback.
      </p>

      {/* Sub-abas de Navegação */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "22px", borderBottom: `1px solid ${LINE}`, flexWrap: "wrap" }}>
        {[
          { id: "perfis", label: "Perfis DISC" },
          { id: "perguntas", label: "Perguntas" },
          { id: "devolucao", label: "Devolução" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              background: "none",
              border: "none",
              padding: "10px 16px",
              fontFamily: "IBM Plex Sans, sans-serif",
              fontSize: "13.5px",
              fontWeight: 600,
              color: activeSubTab === tab.id ? NAVY : "#9AA192",
              borderBottom: activeSubTab === tab.id ? `2px solid ${NAVY}` : "2px solid transparent",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === "perfis" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "16px", marginBottom: "32px" }}>
            {perfis.map((p) => (
              <Card key={p.sigla} style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                  <span style={{
                    fontFamily: "IBM Plex Mono, monospace",
                    fontSize: "20px",
                    fontWeight: "bold",
                    backgroundColor: p.cor,
                    color: "#fff",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "4px"
                  }}>
                    {p.sigla}
                  </span>
                  <div>
                    <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "18px", margin: 0 }}>{p.nome}</h3>
                    <span style={{ fontSize: "12.5px", color: NAVY_SOFT }}>Características principais</span>
                  </div>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: NAVY_SOFT, display: "block", marginBottom: "6px" }}>
                    Como Lidar no Dia a Dia:
                  </span>
                  <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", lineHeight: 1.5 }}>
                    {p.comoLidar.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: "4px" }}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: "12px" }}>
                  <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: NAVY_SOFT, display: "block", marginBottom: "4px" }}>
                    Foco do Feedback:
                  </span>
                  <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.4, fontStyle: "italic" }}>
                    "{p.feedback}"
                  </p>
                </div>
              </Card>
            ))}
          </div>

          <div style={{ borderTop: `2px solid ${LINE}`, paddingTop: "24px" }}>
            <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "20px", fontWeight: 600, marginBottom: "6px" }}>
              Guias Rápidos e Infográficos
            </h3>
            <p style={{ color: NAVY_SOFT, fontSize: "14px", margin: "0 0 20px 0" }}>
              Consulte os guias abaixo para referência rápida ao preparar conversas de feedback.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              <div style={{ background: PAPER_RAISED, border: `1px solid ${LINE}`, borderRadius: "4px", padding: "12px" }}>
                <h4 style={{ fontFamily: "Fraunces, serif", fontSize: "15px", margin: "0 0 10px 0", color: NAVY }}>Estrutura de Feedback</h4>
                <img src={feed1} alt="Estrutura de Feedback" style={{ width: "100%", height: "auto", borderRadius: "3px", objectFit: "contain" }} />
              </div>
              <div style={{ background: PAPER_RAISED, border: `1px solid ${LINE}`, borderRadius: "4px", padding: "12px" }}>
                <h4 style={{ fontFamily: "Fraunces, serif", fontSize: "15px", margin: "0 0 10px 0", color: NAVY }}>Adaptando a Linguagem</h4>
                <img src={feed2} alt="Adaptando a Linguagem" style={{ width: "100%", height: "auto", borderRadius: "3px", objectFit: "contain" }} />
              </div>
              <div style={{ background: PAPER_RAISED, border: `1px solid ${LINE}`, borderRadius: "4px", padding: "12px" }}>
                <h4 style={{ fontFamily: "Fraunces, serif", fontSize: "15px", margin: "0 0 10px 0", color: NAVY }}>Armadilhas Comuns</h4>
                <img src={feed3} alt="Armadilhas Comuns" style={{ width: "100%", height: "auto", borderRadius: "3px", objectFit: "contain" }} />
              </div>
            </div>
          </div>
        </>
      )}

      {activeSubTab === "perguntas" && <PerguntasSubTab />}
      {activeSubTab === "devolucao" && <DevolucaoSubTab />}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Feedbacks                                                              */
/* ---------------------------------------------------------------------- */
function FeedbacksPage({ user, users, feedbacks, onCreate }) {
  const [showForm, setShowForm] = useState(false);
  const [destinatarioId, setDestinatarioId] = useState("");
  const [tipo, setTipo] = useState(FEEDBACK_TIPOS[0].id);
  const [texto, setTexto] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const destinatarios =
    user.role === "gestor" ? users.filter((u) => u.gestorId === user.id) : users.filter((u) => u.id === user.gestorId);

  const minhas = feedbacks
    .filter((f) => f.autorId === user.id || f.destinatarioId === user.id)
    .filter((f) => filtroTipo === "todos" || f.tipo === filtroTipo)
    .sort((a, b) => b.criadoEm - a.criadoEm);

  const submit = (e) => {
    e.preventDefault();
    if (!destinatarioId || !texto.trim()) return;
    const dest = users.find((u) => u.id === destinatarioId);
    onCreate({
      id: uid(),
      autorId: user.id,
      autorNome: user.name,
      destinatarioId,
      destinatarioNome: dest.name,
      tipo,
      texto: texto.trim(),
      data: new Date().toISOString().slice(0, 10),
      criadoEm: Date.now(),
    });
    setTexto("");
    setDestinatarioId("");
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: "26px", fontWeight: 600, margin: "0 0 4px 0" }}>Feedbacks</h2>
          <p style={{ color: NAVY_SOFT, fontSize: "14px", margin: 0 }}>Histórico completo de feedbacks trocados.</p>
        </div>
        {destinatarios.length > 0 && (
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? "Cancelar" : "Novo feedback"}
          </Button>
        )}
      </div>

      {showForm && (
        <Card style={{ padding: "20px", marginBottom: "22px" }}>
          <form onSubmit={submit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }} className="form-grid">
              <Field label="Para">
                <select style={inputStyle} value={destinatarioId} onChange={(e) => setDestinatarioId(e.target.value)} required>
                  <option value="">Selecione…</option>
                  {destinatarios.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tipo">
                <select style={inputStyle} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {FEEDBACK_TIPOS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Mensagem">
              <textarea
                style={{ ...inputStyle, minHeight: "100px", resize: "vertical", fontFamily: "IBM Plex Sans, sans-serif" }}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Descreva o contexto, o comportamento observado e o impacto…"
                required
              />
            </Field>
            <Button type="submit">
              <Send size={15} /> Enviar feedback
            </Button>
          </form>
        </Card>
      )}

      <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
        <button
          onClick={() => setFiltroTipo("todos")}
          style={{
            border: `1px solid ${filtroTipo === "todos" ? NAVY : LINE}`,
            background: filtroTipo === "todos" ? NAVY : "#fff",
            color: filtroTipo === "todos" ? "#fff" : INK,
            fontSize: "12px",
            fontWeight: 600,
            padding: "6px 12px",
            borderRadius: "3px",
            cursor: "pointer",
          }}
        >
          Todos
        </button>
        {FEEDBACK_TIPOS.map((t) => (
          <button
            key={t.id}
            onClick={() => setFiltroTipo(t.id)}
            style={{
              border: `1px solid ${filtroTipo === t.id ? t.cor : LINE}`,
              background: filtroTipo === t.id ? t.cor : "#fff",
              color: filtroTipo === t.id ? "#fff" : INK,
              fontSize: "12px",
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: "3px",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {minhas.length === 0 ? (
        <Card style={{ padding: "28px", textAlign: "center", color: NAVY_SOFT }}>Nenhum feedback por aqui ainda.</Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {minhas.map((f) => {
            const t = FEEDBACK_TIPOS.find((x) => x.id === f.tipo);
            const recebido = f.destinatarioId === user.id;
            return (
              <Card key={f.id} style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <Badge color={t.cor}>{t.label}</Badge>
                    <span style={{ fontSize: "12.5px", color: NAVY_SOFT }}>
                      {recebido ? `de ${f.autorNome}` : `para ${f.destinatarioNome}`}
                    </span>
                  </div>
                  <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "12px", color: NAVY_SOFT }}>{fmtData(f.data)}</span>
                </div>
                <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5 }}>{f.texto}</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Agenda                                                                 */
/* ---------------------------------------------------------------------- */
function AgendaPage({ user, users, agenda, onCreate, onUpdateStatus }) {
  const [showForm, setShowForm] = useState(false);
  const [colaboradorId, setColaboradorId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [notas, setNotas] = useState("");

  const equipe = users.filter((u) => u.gestorId === user.id);
  const minhaAgenda = agenda
    .filter((a) => (user.role === "gestor" ? a.gestorId === user.id : a.colaboradorId === user.id))
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));

  const submit = (e) => {
    e.preventDefault();
    if (!colaboradorId || !titulo.trim() || !data || !hora) return;
    onCreate({
      id: uid(),
      gestorId: user.id,
      colaboradorId,
      titulo: titulo.trim(),
      data,
      hora,
      notas: notas.trim(),
      status: "Agendado",
    });
    setTitulo("");
    setData("");
    setHora("");
    setNotas("");
    setColaboradorId("");
    setShowForm(false);
  };

  const statusColor = { Agendado: "#C8952B", Realizado: "#3F7A5E", Cancelado: "#9AA192" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: "26px", fontWeight: 600, margin: "0 0 4px 0" }}>Agenda de feedback</h2>
          <p style={{ color: NAVY_SOFT, fontSize: "14px", margin: 0 }}>Conversas marcadas e realizadas.</p>
        </div>
        {user.role === "gestor" && equipe.length > 0 && (
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? "Cancelar" : "Agendar conversa"}
          </Button>
        )}
      </div>

      {showForm && (
        <Card style={{ padding: "20px", marginBottom: "22px" }}>
          <form onSubmit={submit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }} className="form-grid">
              <Field label="Colaborador">
                <select style={inputStyle} value={colaboradorId} onChange={(e) => setColaboradorId(e.target.value)} required>
                  <option value="">Selecione…</option>
                  {equipe.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Título">
                <input style={inputStyle} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Feedback trimestral" required />
              </Field>
              <Field label="Data">
                <input type="date" style={inputStyle} value={data} onChange={(e) => setData(e.target.value)} required />
              </Field>
              <Field label="Hora">
                <input type="time" style={inputStyle} value={hora} onChange={(e) => setHora(e.target.value)} required />
              </Field>
            </div>
            <Field label="Notas (opcional)">
              <textarea style={{ ...inputStyle, minHeight: "70px", fontFamily: "IBM Plex Sans, sans-serif" }} value={notas} onChange={(e) => setNotas(e.target.value)} />
            </Field>
            <Button type="submit">
              <CalendarClock size={15} /> Agendar
            </Button>
          </form>
        </Card>
      )}

      {minhaAgenda.length === 0 ? (
        <Card style={{ padding: "28px", textAlign: "center", color: NAVY_SOFT }}>Nada agendado ainda.</Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {minhaAgenda.map((a) => {
            const outro = user.role === "gestor" ? users.find((u) => u.id === a.colaboradorId) : users.find((u) => u.id === a.gestorId);
            return (
              <Card key={a.id} style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600, fontSize: "15px" }}>{a.titulo}</span>
                      <Badge color={statusColor[a.status]}>{a.status}</Badge>
                    </div>
                    <div style={{ fontSize: "12.5px", color: NAVY_SOFT }}>com {outro?.name || "—"}</div>
                    {a.notas && <p style={{ fontSize: "13px", margin: "6px 0 0 0" }}>{a.notas}</p>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "13px", color: NAVY_SOFT }}>
                      {fmtData(a.data)} · {a.hora}
                    </div>
                    {user.role === "gestor" && a.status === "Agendado" && (
                      <div style={{ display: "flex", gap: "6px", marginTop: "8px", justifyContent: "flex-end" }}>
                        <Button variant="ghost" style={{ padding: "5px 10px", fontSize: "12px" }} onClick={() => onUpdateStatus(a.id, "Realizado")}>
                          <Check size={13} /> Realizado
                        </Button>
                        <Button variant="danger" style={{ padding: "5px 10px", fontSize: "12px" }} onClick={() => onUpdateStatus(a.id, "Cancelado")}>
                          <X size={13} /> Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  DISC test                                                              */
/* ---------------------------------------------------------------------- */
function DiscPage({ user, discResult, onSave }) {
  const [answers, setAnswers] = useState(Array(DISC_BLOCKS.length).fill(null).map(() => ({ mais: null, menos: null })));
  const [step, setStep] = useState(0);
  const [testing, setTesting] = useState(!discResult);

  const setPick = (kind, letra) => {
    setAnswers((prev) => {
      const next = [...prev];
      const other = kind === "mais" ? "menos" : "mais";
      const cur = { ...next[step] };
      cur[kind] = letra;
      if (cur[other] === letra) cur[other] = null;
      next[step] = cur;
      return next;
    });
  };

  const podeAvancar = answers[step].mais && answers[step].menos;
  const finished = step === DISC_BLOCKS.length - 1 && podeAvancar;

  const finalizar = () => {
    const tally = { D: 0, I: 0, S: 0, C: 0 };
    answers.forEach((a) => {
      if (a.mais) tally[a.mais] += 1;
      if (a.menos) tally[a.menos] -= 1;
    });
    const resultado = {};
    Object.keys(tally).forEach((k) => {
      resultado[k] = Math.round(((tally[k] + 12) / 24) * 100);
    });
    const dominante = Object.entries(resultado).sort((a, b) => b[1] - a[1])[0][0];
    onSave({ resultado, dominante, data: new Date().toISOString().slice(0, 10) });
    setTesting(false);
  };

  if (!testing && discResult) {
    return (
      <div>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: "26px", fontWeight: 600, margin: "0 0 4px 0" }}>Seu perfil DISC</h2>
        <p style={{ color: NAVY_SOFT, fontSize: "14px", margin: "0 0 22px 0" }}>Concluído em {fmtData(discResult.data)}.</p>
        <Card style={{ padding: "26px" }}>
          <div style={{ display: "flex", gap: "28px", flexWrap: "wrap", alignItems: "center" }}>
            <Compass scores={discResult.resultado} size={220} />
            <div style={{ flex: 1, minWidth: "220px" }}>
              <Badge color={DISC_INFO[discResult.dominante].cor}>
                Perfil dominante: {discResult.dominante} · {DISC_INFO[discResult.dominante].nome}
              </Badge>
              <p style={{ fontSize: "14px", lineHeight: 1.6, margin: "12px 0 20px 0" }}>{DISC_INFO[discResult.dominante].desc}</p>
              {Object.entries(discResult.resultado).map(([k, v]) => (
                <div key={k} style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "3px" }}>
                    <span style={{ fontWeight: 600 }}>{k} · {DISC_INFO[k].nome}</span>
                    <span style={{ fontFamily: "IBM Plex Mono, monospace" }}>{v}%</span>
                  </div>
                  <div style={{ background: LINE, height: "6px", borderRadius: "3px" }}>
                    <div style={{ width: `${v}%`, background: DISC_INFO[k].cor, height: "6px", borderRadius: "3px" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Button
            variant="ghost"
            style={{ marginTop: "18px" }}
            onClick={() => {
              setAnswers(Array(DISC_BLOCKS.length).fill(null).map(() => ({ mais: null, menos: null })));
              setStep(0);
              setTesting(true);
            }}
          >
            Refazer teste
          </Button>
        </Card>
      </div>
    );
  }

  const block = DISC_BLOCKS[step];
  return (
    <div>
      <h2 style={{ fontFamily: "Fraunces, serif", fontSize: "26px", fontWeight: 600, margin: "0 0 4px 0" }}>Teste DISC</h2>
      <p style={{ color: NAVY_SOFT, fontSize: "14px", margin: "0 0 22px 0" }}>
        Para cada grupo, marque a palavra que <b>mais</b> e a que <b>menos</b> combina com você. Bloco {step + 1} de {DISC_BLOCKS.length}.
      </p>
      <Card style={{ padding: "24px", maxWidth: "560px" }}>
        <div style={{ background: LINE, height: "5px", borderRadius: "3px", marginBottom: "22px" }}>
          <div style={{ width: `${((step) / DISC_BLOCKS.length) * 100}%`, background: NAVY, height: "5px", borderRadius: "3px", transition: "width .2s" }} />
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "11px", textTransform: "uppercase", color: NAVY_SOFT }}>
              <td></td>
              <td style={{ textAlign: "center", padding: "4px" }}>Mais</td>
              <td style={{ textAlign: "center", padding: "4px" }}>Menos</td>
            </tr>
          </thead>
          <tbody>
            {["D", "I", "S", "C"].map((letra) => (
              <tr key={letra} style={{ borderTop: `1px solid ${LINE}` }}>
                <td style={{ padding: "10px 6px", fontSize: "14.5px" }}>{block[letra]}</td>
                <td style={{ textAlign: "center" }}>
                  <input
                    type="radio"
                    name={`mais-${step}`}
                    checked={answers[step].mais === letra}
                    onChange={() => setPick("mais", letra)}
                    style={{ accentColor: DISC_INFO[letra].cor, width: "17px", height: "17px", cursor: "pointer" }}
                  />
                </td>
                <td style={{ textAlign: "center" }}>
                  <input
                    type="radio"
                    name={`menos-${step}`}
                    checked={answers[step].menos === letra}
                    onChange={() => setPick("menos", letra)}
                    style={{ accentColor: DISC_INFO[letra].cor, width: "17px", height: "17px", cursor: "pointer" }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "22px" }}>
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            Voltar
          </Button>
          {finished ? (
            <Button onClick={finalizar} disabled={!podeAvancar}>
              Ver resultado
            </Button>
          ) : (
            <Button disabled={!podeAvancar} onClick={() => setStep((s) => Math.min(DISC_BLOCKS.length - 1, s + 1))}>
              Próximo
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  App shell                                                              */
/* ---------------------------------------------------------------------- */
export default function App() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [discResults, setDiscResults] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  // Assina as coleções do Firestore em tempo real se configurado: qualquer alteração feita
  // por qualquer pessoa (gestor ou colaborador) aparece na hora para todos.
  useEffect(() => {
    if (isFirebaseConfigured) {
      const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
      const unsubFeedbacks = onSnapshot(collection(db, "feedbacks"), (snap) => {
        setFeedbacks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
      const unsubAgenda = onSnapshot(collection(db, "agenda"), (snap) => {
        setAgenda(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
      const unsubDisc = onSnapshot(collection(db, "discResults"), (snap) => {
        const map = {};
        snap.docs.forEach((d) => {
          map[d.id] = d.data();
        });
        setDiscResults(map);
      });

      // Escuta mudanças de autenticação do Firebase
              let unsubUserDoc = null;
        const unsubAuth = onAuthStateChanged(auth, (user) => {
          if (user) {
            unsubUserDoc = onSnapshot(doc(db, "users", user.uid), (userSnap) => {
              if (userSnap.exists()) {
                const loggedUser = { id: user.uid, ...userSnap.data() };
                setCurrentUser(loggedUser);
                localStorage.setItem("disc_currentUser", JSON.stringify(loggedUser));
              } else {
                setCurrentUser({ id: user.uid, email: user.email, name: user.email.split("@")[0], role: "colaborador" });
              }
              setLoading(false);
            }, (err) => {
              console.warn("User doc sync error:", err);
              setCurrentUser({ id: user.uid, email: user.email, name: user.email.split("@")[0], role: "colaborador" });
              setLoading(false);
            });
          } else {
            if (unsubUserDoc) unsubUserDoc();
            setCurrentUser(null);
            localStorage.removeItem("disc_currentUser");
            setLoading(false);
          }
        });

      return () => {
        unsubUsers();
        unsubFeedbacks();
        unsubAgenda();
        unsubDisc();
        unsubAuth();
      };
    } else {
      const savedUser = localStorage.getItem("disc_currentUser");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
      const localUsers = JSON.parse(localStorage.getItem("disc_users") || "[]");
      const localFeedbacks = JSON.parse(localStorage.getItem("disc_feedbacks") || "[]");
      const localAgenda = JSON.parse(localStorage.getItem("disc_agenda") || "[]");
      const localDisc = JSON.parse(localStorage.getItem("disc_results") || "{}");
      setUsers(localUsers);
      setFeedbacks(localFeedbacks);
      setAgenda(localAgenda);
      setDiscResults(localDisc);
      setLoading(false);
    }
  }, []);

  const handleRegister = async (novo) => {
    // Esse método agora é apenas o fallback off-line, pois o fluxo principal no AuthScreen
    // com Firebase configurado chama diretamente createUserWithEmailAndPassword.
    const updatedUsers = [...users, novo];
    setUsers(updatedUsers);
    localStorage.setItem("disc_users", JSON.stringify(updatedUsers));
    setCurrentUser(novo);
    localStorage.setItem("disc_currentUser", JSON.stringify(novo));
  };

  const handleLogin = (u) => {
    // Esse método agora é apenas o fallback off-line, pois o fluxo principal no AuthScreen
    // com Firebase configurado chama diretamente signInWithEmailAndPassword.
    setCurrentUser(u);
    localStorage.setItem("disc_currentUser", JSON.stringify(u));
    setPage("dashboard");
  };

  const handleCreateFeedback = async (f) => {
    if (isFirebaseConfigured) {
      const { id: _drop, ...data } = f;
      await addDoc(collection(db, "feedbacks"), data);
    } else {
      const updatedFeedbacks = [...feedbacks, f];
      setFeedbacks(updatedFeedbacks);
      localStorage.setItem("disc_feedbacks", JSON.stringify(updatedFeedbacks));
    }
  };

  const handleCreateAgenda = async (a) => {
    if (isFirebaseConfigured) {
      const { id: _drop, ...data } = a;
      await addDoc(collection(db, "agenda"), data);
    } else {
      const updatedAgenda = [...agenda, a];
      setAgenda(updatedAgenda);
      localStorage.setItem("disc_agenda", JSON.stringify(updatedAgenda));
    }
  };

  const handleUpdateAgendaStatus = async (id, status) => {
    if (isFirebaseConfigured) {
      await updateDoc(doc(db, "agenda", id), { status });
    } else {
      const updatedAgenda = agenda.map((item) =>
        item.id === id ? { ...item, status } : item
      );
      setAgenda(updatedAgenda);
      localStorage.setItem("disc_agenda", JSON.stringify(updatedAgenda));
    }
  };

  const handleSaveDisc = async (result) => {
    if (isFirebaseConfigured) {
      await setDoc(doc(db, "discResults", currentUser.id), result);
    } else {
      const updatedDisc = { ...discResults, [currentUser.id]: result };
      setDiscResults(updatedDisc);
      localStorage.setItem("disc_results", JSON.stringify(updatedDisc));
    }
  };

  const navItems = useMemo(() => {
    const base = [
      { id: "dashboard", label: "Painel", icon: LayoutDashboard },
      { id: "feedbacks", label: "Feedbacks", icon: MessageSquareText },
      { id: "agenda", label: "Agenda", icon: CalendarClock },
    ];
    if (currentUser?.role === "gestor") {
      base.splice(1, 0, { id: "colaboradores", label: "Colaboradores", icon: Users });
      base.push({ id: "guiaDisc", label: "Como Lidar (DISC)", icon: BookOpen });
    }
    if (currentUser?.role === "colaborador") base.push({ id: "disc", label: "Teste DISC", icon: CompassIcon });
    return base;
  }, [currentUser]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: GOL_SIDEBAR, fontFamily: "Inter, sans-serif" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: GOL_ORANGE, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
          <CompassIcon size={22} color="#fff" />
        </div>
        <span style={{ color: "#888", fontSize: "14px", letterSpacing: "0.04em" }}>Carregando…</span>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen users={users} onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: PAPER, fontFamily: "Inter, sans-serif", color: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { border-color: ${GOL_ORANGE} !important; box-shadow: 0 0 0 3px ${GOL_ORANGE}22 !important; outline: none; }
        @media (max-width: 780px) {
          .app-shell { flex-direction: column !important; }
          .app-sidebar { width: 100% !important; flex-direction: row !important; overflow-x: auto; padding: 10px 12px !important; min-height: unset !important; }
          .app-sidebar .nav-list { flex-direction: row !important; }
          .dash-grid { grid-template-columns: 1fr !important; }
          .form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div className="app-shell" style={{ display: "flex", minHeight: "100vh" }}>

        {/* ── DARK SIDEBAR ── */}
        <div className="app-sidebar" style={{
          width: "260px",
          minHeight: "100vh",
          background: GOL_SIDEBAR,
          display: "flex",
          flexDirection: "column",
          padding: "24px 14px",
          flexShrink: 0,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", paddingLeft: "8px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: GOL_ORANGE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <CompassIcon size={17} color="#fff" />
            </div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "15px" }}>Bússola</span>
          </div>

          {/* Firebase status indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "28px", paddingLeft: "8px" }}>
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%",
              backgroundColor: isFirebaseConfigured ? "#4CAF50" : "#FF9800",
              display: "inline-block", flexShrink: 0
            }} />
            <span style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {isFirebaseConfigured ? "Nuvem ativa" : "Modo local"}
            </span>
          </div>

          {/* Nav items */}
          <div className="nav-list" style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = page === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    border: "none",
                    borderRadius: "8px",
                    background: active ? GOL_ORANGE : "transparent",
                    color: active ? "#fff" : "#999",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13.5px",
                    fontWeight: active ? 600 : 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    textAlign: "left",
                    transition: "all .15s ease",
                    boxShadow: active ? `0 4px 12px ${GOL_ORANGE}55` : "none",
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = GOL_SIDEBAR_HOVER; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#999"; } }}
                >
                  <Icon size={16} /> {item.label}
                </button>
              );
            })}
          </div>

          {/* User info + logout */}
          <div style={{ borderTop: "1px solid #2a2a2a", paddingTop: "16px", marginTop: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: GOL_ORANGE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: "13px" }}>
                  {(currentUser?.name || currentUser?.username || "U").charAt(0).toUpperCase()}
                </span>
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentUser?.name || currentUser?.username || "Usuario"}</div>
                <div style={{ marginTop: "4px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 7px", borderRadius: "10px", background: currentUser.role === "admin" ? "#FF6F1F" : currentUser.role === "gestor" ? "#1e3a5f" : "#2a2a2a", color: currentUser.role === "admin" ? "#fff" : currentUser.role === "gestor" ? "#8BB8D4" : "#888", border: "1px solid " + (currentUser.role === "admin" ? "#FF6F1F66" : currentUser.role === "gestor" ? "#35577A66" : "#333") }}>{currentUser.role === "admin" ? "ADMIN" : currentUser.role === "gestor" ? "GESTOR" : "COLABORADOR"}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                if (isFirebaseConfigured) {
                  signOut(auth);
                } else {
                  setCurrentUser(null);
                  localStorage.removeItem("disc_currentUser");
                }
              }}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#555", fontSize: "12.5px", fontWeight: 500, cursor: "pointer", padding: "6px 4px", borderRadius: "6px", transition: "color .15s" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#E53935"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#555"}
            >
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>

        {/* ── CONTENT AREA ── */}
        <div style={{ flex: 1, padding: "36px 40px", maxWidth: "1000px", overflowX: "hidden" }}>
          
          {page === "dashboard" && (
            <Dashboard user={currentUser} users={users} feedbacks={feedbacks} agenda={agenda} discResults={discResults} goTo={setPage} />
          )}
          {page === "colaboradores" && (currentUser?.role === "gestor" || currentUser?.role === "admin") && (
            <ColaboradoresPage user={currentUser} users={users} discResults={discResults} />
          )}
          {page === "gestores" && currentUser?.role === "admin" && (
            <GestoresPage users={users} discResults={discResults} feedbacks={feedbacks} />
          )}
          {page === "feedbacks" && (
            <FeedbacksPage user={currentUser} users={users} feedbacks={feedbacks} onCreate={handleCreateFeedback} />
          )}
          {page === "agenda" && (
            <AgendaPage user={currentUser} users={users} agenda={agenda} onCreate={handleCreateAgenda} onUpdateStatus={handleUpdateAgendaStatus} />
          )}
          {page === "disc" && currentUser?.role === "colaborador" && (
            <DiscPage user={currentUser} discResult={discResults[currentUser.id]} onSave={handleSaveDisc} />
          )}
          {page === "guiaDisc" && (currentUser?.role === "gestor" || currentUser?.role === "admin") && (
            <GuiaDiscPage />
          )}
        </div>
      </div>
    </div>
  );
}
