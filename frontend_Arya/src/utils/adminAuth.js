import { getSession } from './auth';

export const getAdminSessionInfo = () => {
  const session = getSession();

  if (!session || !session.email) {
    return { isAuthenticated: false, isGovernment: false, session: null };
  }

  const isGovernment = session.accountType === 'government';

  return {
    isAuthenticated: true,
    isGovernment,
    session
  };
};

export const getAdminIdentity = (session) => {
  const displayName = session?.fullName || 'Admin User';
  const seedName = (session?.fullName || session?.email || 'AU').trim();
  const initials = seedName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return {
    adminName: displayName,
    adminAvatar: initials || 'AU'
  };
};
