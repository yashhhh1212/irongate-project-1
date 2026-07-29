import { useState, useEffect, useRef } from "react";

const MEMBERS = [
  { id: "FOB-001", name: "Yash", plan: "24/7 Access", photo: "YA", pin: "1234", expires: "2026-12-31", status: "active" },
  { id: "FOB-002", name: "Manish", plan: "Peak Hours", photo: "MA", pin: "2222", expires: "2026-11-15", status: "active" },
  { id: "FOB-003", name: "Amit", plan: "24/7 Access", photo: "AM", pin: "3333", expires: "2026-10-01", status: "suspended" },
  { id: "FOB-004", name: "Tanvi", plan: "Student Plan", photo: "TA", pin: "4444", expires: "2026-01-15", status: "expired" },
];

const PEAK_HOURS = { start: 6, end: 22 };

function isPeakTime() {
  const h = new Date().getHours();
  return h >= PEAK_HOURS.start && h < PEAK_HOURS.end;
}

function checkAccess(member) {
  if (member.status === "suspended") return { granted: false, reason: "Membership suspended. Contact front desk." };
  if (member.status === "expired") return { granted: false, reason: "Membership expired on " + member.expires };
  if (member.plan === "Peak Hours" && !isPeakTime()) return { granted: false, reason: "Peak Hours plan — access allowed 6 AM–10 PM only." };
  return { granted: true, reason: "Welcome back!" };
}

const avatarColors = ["#E63946", "#457B9D", "#2A9D8F", "#E9C46A"];

export default function GymKiosk() {
  const [phase, setPhase] = useState("idle"); // idle | pin | scanning | result
  const [pendingMember, setPendingMember] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [pinShake, setPinShake] = useState(false);
  const [result, setResult] = useState(null);
  const [log, setLog] = useState([]);
  const [time, setTime] = useState(new Date());
  const pinTimeout = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  function startScan(member) {
    if (phase !== "idle") return;
    setPendingMember(member);
    setPinInput("");
    setPinError(false);
    setPhase("pin");
  }

  function handlePinKey(key) {
    if (pinInput.length >= 4) return;
    const next = pinInput + key;
    setPinInput(next);
    if (next.length === 4) {
      setTimeout(() => submitPin(next), 200);
    }
  }

  function submitPin(pin) {
    if (pin === pendingMember.pin) {
      setPinError(false);
      setPhase("scanning");
      setTimeout(() => {
        const access = checkAccess(pendingMember);
        setResult({ member: pendingMember, ...access });
        setPhase("result");
        setLog((prev) => [
          {
            time: new Date().toLocaleTimeString(),
            name: pendingMember.name,
            granted: access.granted,
            id: pendingMember.id,
          },
          ...prev.slice(0, 9),
        ]);
        setTimeout(() => {
          setPhase("idle");
          setResult(null);
          setPendingMember(null);
          setPinInput("");
        }, 3500);
      }, 1200);
    } else {
      setPinShake(true);
      setPinError(true);
      setPinInput("");
      setTimeout(() => setPinShake(false), 500);
      clearTimeout(pinTimeout.current);
      pinTimeout.current = setTimeout(() => {
        setPinError(false);
      }, 2000);
    }
  }

  function cancelPin() {
    setPhase("idle");
    setPendingMember(null);
    setPinInput("");
    setPinError(false);
  }

  const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = time.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });

  const ringColor =
    phase === "scanning" ? "#ff3a5c"
    : phase === "result" && result?.granted ? "#00e676"
    : phase === "result" ? "#ff3a5c"
    : phase === "pin" ? "#f5a623"
    : "#1e1e2e";

  const ringGlow =
    phase === "scanning" ? "0 0 30px #ff3a5c88"
    : phase === "result" && result?.granted ? "0 0 30px #00e67688"
    : phase === "result" ? "0 0 30px #ff3a5c88"
    : phase === "pin" ? "0 0 20px #f5a62355"
    : "none";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        display: "flex",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: "#fff",
      }}
    >
      {/* LEFT: Kiosk */}
      <div
        style={{
          flex: "0 0 400px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "40px 32px",
          background: "linear-gradient(160deg, #0f0f1a 0%, #0a0a0f 100%)",
          borderRight: "1px solid #1e1e2e",
          minHeight: "100vh",
        }}
      >
        {/* Header */}
        <div style={{ width: "100%", textAlign: "center" }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 4,
              color: "#ff3a5c",
              fontWeight: 700,
              marginBottom: 24,
            }}
          >
            ● IRONGATE FITNESS
          </div>
          <div style={{ fontSize: 13, color: "#555", letterSpacing: 1 }}>{dateStr}</div>
          <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -2, color: "#fff", lineHeight: 1.1 }}>
            {timeStr}
          </div>
        </div>

        {/* Scanner area */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          {/* Ring */}
          <div style={{ position: "relative", width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                border: `2px solid ${ringColor}`,
                boxShadow: ringGlow,
                transition: "all 0.4s ease",
                animation: phase === "scanning" ? "spin 1.2s linear infinite" : "none",
              }}
            />
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                background:
                  phase === "result" && result?.granted ? "#00e67615"
                  : phase === "result" ? "#ff3a5c15"
                  : phase === "pin" ? "#f5a62310"
                  : "#111122",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #1e1e2e",
                transition: "background 0.3s",
              }}
            >
              {phase === "idle" && (
                <>
                  <div style={{ fontSize: 36 }}>🔒</div>
                  <div style={{ fontSize: 11, color: "#444", marginTop: 6, letterSpacing: 1 }}>READY</div>
                </>
              )}
              {phase === "pin" && (
                <>
                  <div style={{ fontSize: 30 }}>🔑</div>
                  <div style={{ fontSize: 10, color: "#f5a623", letterSpacing: 2, fontWeight: 700, marginTop: 6 }}>
                    ENTER PIN
                  </div>
                </>
              )}
              {phase === "scanning" && (
                <>
                  <div style={{ fontSize: 11, color: "#ff3a5c", letterSpacing: 2, fontWeight: 700 }}>SCANNING</div>
                  <div style={{ fontSize: 10, color: "#444", marginTop: 4 }}>Please wait...</div>
                </>
              )}
              {phase === "result" && result && (
                <>
                  <div style={{ fontSize: 32 }}>{result.granted ? "✅" : "🚫"}</div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 2,
                      color: result.granted ? "#00e676" : "#ff3a5c",
                      marginTop: 6,
                    }}
                  >
                    {result.granted ? "ACCESS GRANTED" : "ACCESS DENIED"}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* PIN Entry UI */}
          {phase === "pin" && pendingMember && (
            <div
              style={{
                background: "#111122",
                border: "1px solid #1e1e2e",
                borderRadius: 16,
                padding: "20px 24px",
                width: "100%",
                textAlign: "center",
                animation: pinShake ? "shake 0.4s ease" : "fadeIn 0.3s ease",
              }}
            >
              <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>
                👋 Hey <strong style={{ color: "#fff" }}>{pendingMember.name}</strong>, enter your 4-digit PIN
              </div>

              {/* Dots */}
              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 14 }}>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: i < pinInput.length ? (pinError ? "#ff3a5c" : "#f5a623") : "#1a1a2e",
                      border: `2px solid ${i < pinInput.length ? (pinError ? "#ff3a5c" : "#f5a623") : "#2a2a3e"}`,
                      transition: "all 0.15s",
                    }}
                  />
                ))}
              </div>

              {pinError && (
                <div style={{ color: "#ff3a5c", fontSize: 12, marginBottom: 10, fontWeight: 600 }}>
                  ✗ Incorrect PIN — try again
                </div>
              )}

              {/* Numpad */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (k === "⌫") setPinInput((p) => p.slice(0, -1));
                      else if (k !== "") handlePinKey(k);
                    }}
                    style={{
                      padding: "14px 0",
                      borderRadius: 10,
                      fontSize: 18,
                      fontWeight: 700,
                      background: k === "" ? "transparent" : "#1a1a2e",
                      border: k === "" ? "none" : "1px solid #2a2a3e",
                      color: k === "⌫" ? "#ff3a5c" : "#fff",
                      cursor: k === "" ? "default" : "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (k !== "") e.currentTarget.style.background = "#2a2a3e";
                    }}
                    onMouseLeave={(e) => {
                      if (k !== "") e.currentTarget.style.background = "#1a1a2e";
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>

              <button
                onClick={cancelPin}
                style={{
                  fontSize: 12,
                  color: "#444",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                CANCEL
              </button>
            </div>
          )}

          {/* Result card */}
          {phase === "result" && result && (
            <div
              style={{
                background: "#111122",
                border: "1px solid #1e1e2e",
                borderRadius: 16,
                padding: "18px 24px",
                width: "100%",
                textAlign: "center",
                animation: "fadeIn 0.3s ease",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  margin: "0 auto 12px",
                  background: avatarColors[MEMBERS.findIndex((m) => m.id === result.member.id) % avatarColors.length],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 800,
                }}
              >
                {result.member.photo}
              </div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{result.member.name}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{result.member.plan}</div>
              <div
                style={{
                  fontSize: 12,
                  color: result.granted ? "#00e676" : "#ff3a5c",
                  marginTop: 8,
                }}
              >
                {result.reason}
              </div>
            </div>
          )}

          {phase === "idle" && (
            <div style={{ textAlign: "center", color: "#333", fontSize: 13 }}>Select a keyfob to scan</div>
          )}
        </div>

        <div style={{ fontSize: 11, color: "#2a2a3a", letterSpacing: 1 }}>IRONGATE ACCESS SYSTEM</div>
      </div>

      {/* RIGHT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "40px 40px", gap: 40 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#555", fontWeight: 700, marginBottom: 16 }}>
            REGISTERED KEYFOBS — TAP TO SCAN
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {MEMBERS.map((m, i) => (
              <button
                key={m.id}
                onClick={() => startScan(m)}
                disabled={phase !== "idle"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  background: "#0f0f1a",
                  border: "1px solid #1e1e2e",
                  borderRadius: 12,
                  padding: "14px 20px",
                  cursor: phase === "idle" ? "pointer" : "not-allowed",
                  opacity: phase !== "idle" ? 0.5 : 1,
                  transition: "all 0.2s",
                  textAlign: "left",
                  color: "#fff",
                }}
                onMouseEnter={(e) => {
                  if (phase === "idle") e.currentTarget.style.borderColor = "#3a3a4e";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#1e1e2e";
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: avatarColors[i % avatarColors.length],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 15,
                  }}
                >
                  {m.photo}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
                    {m.plan} · {m.id}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#333", marginRight: 8 }}>PIN: {m.pin}</div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1,
                    padding: "4px 10px",
                    borderRadius: 6,
                    textTransform: "uppercase",
                    background:
                      m.status === "active" ? "#00e67615" : m.status === "expired" ? "#55555522" : "#ff3a5c15",
                    color: m.status === "active" ? "#00e676" : m.status === "expired" ? "#888" : "#ff3a5c",
                    border: `1px solid ${
                      m.status === "active" ? "#00e67633" : m.status === "expired" ? "#55555555" : "#ff3a5c33"
                    }`,
                  }}
                >
                  {m.status}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Access Log */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#555", fontWeight: 700, marginBottom: 16 }}>
            RECENT ACCESS LOG
          </div>
          {log.length === 0 ? (
            <div style={{ color: "#2a2a3a", fontSize: 13, fontStyle: "italic" }}>No scans yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {log.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    background: "#0f0f1a",
                    border: "1px solid #1e1e2e",
                    borderRadius: 10,
                    padding: "10px 16px",
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontSize: 16 }}>{entry.granted ? "✅" : "🚫"}</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600 }}>{entry.name}</span>
                    <span style={{ color: "#444", marginLeft: 8 }}>{entry.id}</span>
                  </div>
                  <div style={{ color: entry.granted ? "#00e676" : "#ff3a5c", fontWeight: 700, fontSize: 11 }}>
                    {entry.granted ? "GRANTED" : "DENIED"}
                  </div>
                  <div style={{ color: "#333", fontSize: 11, marginLeft: 8 }}>{entry.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        * { box-sizing: border-box; }
        button:focus { outline: none; }
      `}</style>
    </div>
  );
}
