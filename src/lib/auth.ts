import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = '@tecinfo/auth/v1';
const CURRENT_USER_KEY = '@tecinfo/current-user/v1';

export type UserRole = 'admin' | 'funcionario';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  createdAt: string;
}

export interface LoginResult {
  user: User | null;
  error: string | null;
}

export interface RegisterEmployeeData {
  name: string;
  password: string;
}

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return String(hash);
}

async function getUsers(): Promise<User[]> {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveUsers(users: User[]): Promise<void> {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function ensureAdmin(): Promise<void> {
  const users = await getUsers();
  const hasAdmin = users.some((u) => u.role === 'admin');
  if (hasAdmin) return;

  const admin: User = {
    id: 'admin_0',
    name: 'Administrador',
    role: 'admin',
    passwordHash: hashPassword('1'),
    createdAt: new Date().toISOString(),
  };
  await saveUsers([admin]);
}

export async function loginUser(
  password: string
): Promise<LoginResult> {
  await ensureAdmin();
  const users = await getUsers();
  const user = users.find((u) => u.passwordHash === hashPassword(password));

  if (!user) {
    return { user: null, error: 'Senha incorreta' };
  }

  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return { user, error: null };
}

export async function registerEmployee(
  currentUser: User | null,
  data: RegisterEmployeeData
): Promise<{ user: User | null; error: string | null }> {
  if (!currentUser || currentUser.role !== 'admin') {
    return { user: null, error: 'Apenas o administrador pode cadastrar funcionários.' };
  }

  const users = await getUsers();

  if (users.some((u) => u.name.toLowerCase() === data.name.trim().toLowerCase())) {
    return { user: null, error: 'Este nome já está cadastrado.' };
  }

  const employee: User = {
    id: `func_${Date.now()}`,
    name: data.name.trim(),
    role: 'funcionario',
    passwordHash: hashPassword(data.password),
    createdAt: new Date().toISOString(),
  };

  users.push(employee);
  await saveUsers(users);
  return { user: employee, error: null };
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(CURRENT_USER_KEY);
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const raw = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function listUsers(): Promise<User[]> {
  return getUsers();
}

export async function deleteEmployee(
  currentUser: User | null,
  employeeId: string
): Promise<{ ok: boolean; error: string | null }> {
  if (!currentUser || currentUser.role !== 'admin') {
    return { ok: false, error: 'Apenas o administrador pode remover funcionários.' };
  }

  const users = await getUsers();
  const filtered = users.filter((u) => u.id !== employeeId && u.id !== 'admin_0');

  if (filtered.length === users.length) {
    return { ok: false, error: 'Funcionário não encontrado.' };
  }

  await saveUsers(filtered);
  return { ok: true, error: null };
}

export function isAdmin(user: User | null): user is User & { role: 'admin' } {
  return user?.role === 'admin';
}

export function isFuncionario(user: User | null): user is User & { role: 'funcionario' } {
  return user?.role === 'funcionario';
}
