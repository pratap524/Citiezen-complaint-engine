const SESSION_KEY = 'cie_auth_session';
const USERS_KEY = 'cie_registered_users';

export const getSession = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && parsed.email ? parsed : null;
  } catch {
    return null;
  }
};

export const isLoggedIn = () => Boolean(getSession());

export const saveSession = (userRecord) => {
  const session = {
    email: userRecord.email,
    fullName: userRecord.fullName,
    organization: userRecord.organization,
    accountType: userRecord.accountType,
    loggedInAt: new Date().toISOString()
  };

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.removeItem(SESSION_KEY);
};

export const clearSession = () => {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
};

export const getRegisteredUsers = () => {
  try {
    const rawUsers = localStorage.getItem(USERS_KEY);
    const parsedUsers = rawUsers ? JSON.parse(rawUsers) : [];
    return Array.isArray(parsedUsers) ? parsedUsers : [];
  } catch {
    return [];
  }
};

export const saveRegisteredUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const isReloadNavigation = () => {
  try {
    const entries = performance.getEntriesByType('navigation');
    if (entries.length > 0) {
      return entries[0].type === 'reload';
    }
  } catch {
    return false;
  }

  return false;
};
