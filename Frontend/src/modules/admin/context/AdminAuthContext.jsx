import { createContext, useContext, useEffect, useState } from 'react';
import { getToken, setToken, adminLogin, request } from '../../../shared/api';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken('admin');
    if (!token) {
      setLoading(false);
      return;
    }

    // Verify session
    request('admin', 'GET', '/api/auth/me').then((res) => {
      if (res.ok && res.data.user && res.data.user.role === 'admin') {
        setAdmin(res.data.user);
      } else {
        setToken('admin', null);
        setAdmin(null);
      }
      setLoading(false);
    }).catch(() => {
      setToken('admin', null);
      setAdmin(null);
      setLoading(false);
    });
  }, []);

  const login = async ({ identifier, password, masterKey }) => {
    const res = await adminLogin({ identifier, password, masterKey });
    if (res.ok) {
      setAdmin(res.user);
      return { ok: true };
    }
    return { ok: false, error: res.error };
  };

  const logout = () => {
    setToken('admin', null);
    setAdmin(null);
    window.location.href = '/admin/login';
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);

