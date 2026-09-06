"use client";

import { FormEvent, useEffect, useState } from "react";

type User = {
  id: number;
  email: string;
  user_type: string;
  market: string;
  wallet: number;
  last_login: string | null;
};

type Log = {
  createdAt: string;
  email: string;
  delta: number;
  amount: number;
  actorEmail: string;
};

type Summary = {
  totalAgents: number;
  totalUsers: number;
  agentWallet: number;
  totalWallet: number;
  recentLogs: Log[];
};

function money(n: number) {
  return `${Number(n || 0).toLocaleString()} ETB`;
}

function when(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "—";
}

export default function Dashboard() {
  const [email, setEmail] = useState("bam@gmail.com");
  const [password, setPassword] = useState("AradaAdmin@2026");
  const [token, setToken] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [newAgent, setNewAgent] = useState({
    email: "",
    password: "",
    market: "",
    wallet: "0"
  });

  async function api(path: string, options: RequestInit = {}) {
    const res = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Token ${token}` : "",
        ...(options.headers || {})
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.email || "Request failed");
    return data;
  }

  async function refresh(nextToken = token) {
    const headers = { Authorization: `Token ${nextToken}` };
    const [list, stats] = await Promise.all([
      fetch("/api/account/list-accounts", { headers }).then((r) => r.json()),
      fetch("/api/hq/summary", { headers }).then((r) => r.json())
    ]);
    setUsers(list);
    setSummary(stats);
  }

  async function login(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const data = await api("/api/account/login", {
        method: "POST",
        body: JSON.stringify({ username: email, password })
      });
      if (data.user.user_type !== "ADMIN") throw new Error("HQ login is for admin accounts only.");
      setToken(data.token);
      setAdminEmail(data.user.email);
      localStorage.setItem("hqToken", data.token);
      localStorage.setItem("hqUser", JSON.stringify(data.user));
      await refresh(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  async function createAgent(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      const user = await api("/api/account/signup", {
        method: "POST",
        body: JSON.stringify({
          email: newAgent.email,
          username: newAgent.email,
          password: newAgent.password,
          market: newAgent.market || "hall",
          wallet: Number(newAgent.wallet) || 0,
          user_type: "USER"
        })
      });
      setMessage(`Created ${user.email} with ${money(user.wallet)}`);
      setNewAgent({ email: "", password: "", market: "", wallet: "0" });
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function recharge(agentEmail: string, mode: "set" | "add") {
    const amount = Number(amounts[agentEmail]);
    if (Number.isNaN(amount)) return alert("Enter an amount");
    await api("/api/bingo/wallet/", {
      method: "POST",
      body: JSON.stringify({
        username: agentEmail,
        amount,
        mode,
        computer_name: "HQ-website"
      })
    });
    await refresh();
  }

  useEffect(() => {
    const savedToken = localStorage.getItem("hqToken");
    const savedUser = localStorage.getItem("hqUser");
    if (!savedToken || !savedUser) return;
    setToken(savedToken);
    setAdminEmail(JSON.parse(savedUser).email);
    refresh(savedToken).catch(() => {
      localStorage.removeItem("hqToken");
      localStorage.removeItem("hqUser");
      setToken("");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!token) {
    return (
      <div className="auth-wrap">
        <div className="panel auth-card">
          <p className="eyebrow">Arada Headquarters</p>
          <h1>Recharge &amp; agents</h1>
          <p className="muted">
            Create hall agents and credit wallets. The desktop bingo app reads these balances from this website.
          </p>
          <form onSubmit={login}>
            <label>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </label>
            <label>
              Password
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            </label>
            <button type="submit">Sign in</button>
            {error ? <p className="error">{error}</p> : null}
          </form>
          <div className="hint">
            <strong>Trial HQ login</strong>
            <span>bam@gmail.com</span>
            <span>AradaAdmin@2026</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="panel topbar">
        <div>
          <p className="eyebrow">Arada HQ</p>
          <h1>Control panel</h1>
        </div>
        <div className="row">
          <span className="pill">{adminEmail}</span>
          <button
            className="ghost"
            type="button"
            onClick={() => {
              localStorage.clear();
              setToken("");
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <section className="stats">
        <article className="panel">
          <span>Agents</span>
          <strong>{summary?.totalAgents ?? 0}</strong>
        </article>
        <article className="panel">
          <span>All users</span>
          <strong>{summary?.totalUsers ?? 0}</strong>
        </article>
        <article className="panel">
          <span>Agent wallets</span>
          <strong>{money(summary?.agentWallet || 0)}</strong>
        </article>
        <article className="panel">
          <span>Total loaded</span>
          <strong>{money(summary?.totalWallet || 0)}</strong>
        </article>
      </section>

      <section className="panel">
        <h2>Create agent</h2>
        <p className="muted">Each agent signs into the bingo app with this email and password.</p>
        <form className="grid-form" onSubmit={createAgent}>
          <label>
            Email
            <input value={newAgent.email} onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })} required />
          </label>
          <label>
            Password
            <input value={newAgent.password} onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })} required />
          </label>
          <label>
            Market / hall
            <input value={newAgent.market} onChange={(e) => setNewAgent({ ...newAgent, market: e.target.value })} />
          </label>
          <label>
            Starting wallet
            <input type="number" min="0" value={newAgent.wallet} onChange={(e) => setNewAgent({ ...newAgent, wallet: e.target.value })} />
          </label>
          <button type="submit">Create agent</button>
        </form>
        {message ? <p className="ok">{message}</p> : null}
      </section>

      <section className="panel">
        <h2>Agents</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Role</th>
                <th>Hall</th>
                <th>Wallet</th>
                <th>Last login</th>
                <th>Recharge</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>{user.user_type}</td>
                  <td>{user.market}</td>
                  <td>{money(user.wallet)}</td>
                  <td>{when(user.last_login)}</td>
                  <td>
                    <div className="row">
                      <input
                        type="number"
                        min="0"
                        placeholder="Amount"
                        value={amounts[user.email] || ""}
                        onChange={(e) => setAmounts({ ...amounts, [user.email]: e.target.value })}
                      />
                      <button className="small" type="button" onClick={() => recharge(user.email, "set")}>
                        Set
                      </button>
                      <button className="small" type="button" onClick={() => recharge(user.email, "add")}>
                        Add
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Recharge log</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Agent</th>
                <th>Change</th>
                <th>New balance</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {(summary?.recentLogs || []).map((log, index) => (
                <tr key={`${log.createdAt}-${index}`}>
                  <td>{when(log.createdAt)}</td>
                  <td>{log.email}</td>
                  <td>
                    {log.delta > 0 ? "+" : ""}
                    {money(log.delta)}
                  </td>
                  <td>{money(log.amount)}</td>
                  <td>{log.actorEmail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
