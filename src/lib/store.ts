import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export type User = {
  id: number;
  username: string;
  email: string;
  phone: string;
  passwordHash: string;
  wallet: number;
  user_type: string;
  usertype: string;
  market: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
};

export type Game = {
  id: number;
  user: { id: number; email: string };
  stake: number;
  number_of_players: number;
  service_fee: number;
  created_at: string;
};

export type WalletLog = {
  id: number;
  userId: number;
  email: string;
  previous: number;
  amount: number;
  delta: number;
  actorEmail: string;
  computer_name: string;
  note: string;
  createdAt: string;
};

type State = {
  nextUserId: number;
  nextGameId: number;
  users: User[];
  tokens: Record<string, { userId: number; createdAt: string }>;
  games: Game[];
  walletLogs: WalletLog[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");
const LEGACY_FILE = path.join(process.cwd(), "..", "hq-server", "data", "store.json");

function emptyState(): State {
  return {
    nextUserId: 1,
    nextGameId: 1,
    users: [],
    tokens: {},
    games: [],
    walletLogs: []
  };
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readFile(file: string): State | null {
  if (!fs.existsSync(file)) return null;
  try {
    return Object.assign(emptyState(), JSON.parse(fs.readFileSync(file, "utf8")));
  } catch {
    return null;
  }
}

export function load(): State {
  ensureDir();
  const current = readFile(DATA_FILE);
  if (current && current.users.length) return current;
  const legacy = readFile(LEGACY_FILE);
  if (legacy && legacy.users.length) {
    save(legacy);
    return legacy;
  }
  const state = emptyState();
  seedIfNeeded(state);
  save(state);
  return state;
}

export function save(state: State) {
  ensureDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

export function publicUser(user: User | null) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    wallet: user.wallet,
    user_type: user.user_type,
    usertype: user.usertype || user.user_type,
    market: user.market,
    is_active: user.is_active,
    last_login: user.last_login,
    created_at: user.created_at
  };
}

export function findUser(state: State, usernameOrEmail: string) {
  const key = String(usernameOrEmail || "").trim().toLowerCase();
  return (
    state.users.find(
      (user) =>
        String(user.email).toLowerCase() === key ||
        String(user.username).toLowerCase() === key
    ) || null
  );
}

export function createUser(
  state: State,
  fields: {
    email?: string;
    username?: string;
    phone?: string;
    password?: string;
    wallet?: number;
    user_type?: string;
    usertype?: string;
    market?: string;
    is_active?: boolean;
  }
) {
  const email = String(fields.email || fields.username || "").trim();
  if (!email) throw new Error("Email is required");
  if (findUser(state, email)) throw new Error("User already exists");
  const userType = String(fields.user_type || fields.usertype || "USER").toUpperCase();
  const user: User = {
    id: state.nextUserId++,
    username: fields.username || email,
    email,
    phone: fields.phone || "",
    passwordHash: bcrypt.hashSync(String(fields.password), 10),
    wallet: Number(fields.wallet) || 0,
    user_type: userType,
    usertype: userType,
    market: fields.market || "hall",
    is_active: fields.is_active !== false,
    last_login: null,
    created_at: new Date().toISOString()
  };
  state.users.push(user);
  return user;
}

export function issueToken(state: State, user: User) {
  const token = crypto.randomBytes(24).toString("hex");
  state.tokens[token] = { userId: user.id, createdAt: new Date().toISOString() };
  return token;
}

export function userFromToken(state: State, header: string | null) {
  if (!header) return null;
  const token = header.startsWith("Token ") ? header.slice(6).trim() : header.trim();
  const rec = state.tokens[token];
  if (!rec) return null;
  return state.users.find((user) => user.id === rec.userId) || null;
}

export function setWallet(
  state: State,
  user: User,
  amount: number,
  actorEmail: string,
  computerName = "",
  note = "set"
) {
  const previous = user.wallet;
  user.wallet = Number(amount) || 0;
  state.walletLogs.unshift({
    id: state.walletLogs.length + 1,
    userId: user.id,
    email: user.email,
    previous,
    amount: user.wallet,
    delta: user.wallet - previous,
    actorEmail: actorEmail || "system",
    computer_name: computerName,
    note,
    createdAt: new Date().toISOString()
  });
  return user;
}

function seedIfNeeded(state: State) {
  if (state.users.length) return;
  createUser(state, {
    email: "bam@gmail.com",
    username: "bam@gmail.com",
    password: "AradaAdmin@2026",
    wallet: 100000,
    user_type: "ADMIN",
    market: "HQ",
    phone: "0000"
  });
  createUser(state, {
    email: "arada@gmail.com",
    username: "arada@gmail.com",
    password: "6644",
    wallet: 0,
    user_type: "USER",
    market: "trial-hall"
  });
  createUser(state, {
    email: "admin@arada.com",
    username: "admin@arada.com",
    password: "admin821361",
    wallet: 1,
    user_type: "ADMIN",
    market: "local"
  });
}
