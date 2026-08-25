import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { AdminPanel } from './AdminPanel';
import { INITIAL_LOCATIONS, DEFAULT_RESORT_CONFIG } from '../data/resortData';
import { LocationItem, ResortConfig } from '../types';
import { Lock, User as UserIcon } from 'lucide-react';
import { AdminUsersTab } from './AdminUsersTab';

const DEFAULT_USERS: User[] = [
  { id: '1', username: 'demo', password: 'demo', role: 'admin', fullName: 'Demo Admin' }
];

export const AdminApp: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // States for AdminPanel to work standalone
  const [locations, setLocations] = useState<LocationItem[]>(INITIAL_LOCATIONS);
  const [resortConfig, setResortConfig] = useState<ResortConfig>(DEFAULT_RESORT_CONFIG);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [activeTab, setActiveTab] = useState<'panel' | 'users'>('panel');

  useEffect(() => {
    const savedUsers = localStorage.getItem('cliff_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      setUsers(DEFAULT_USERS);
      localStorage.setItem('cliff_users', JSON.stringify(DEFAULT_USERS));
    }

    // Restore session from the server-side httpOnly cookie
    fetch('/api/me', { credentials: 'include' })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && data.user) {
          setCurrentUser({
            id: data.user.username,
            username: data.user.username,
            password: '',
            role: data.user.role,
            fullName: data.user.fullName,
          });
        }
      })
      .catch(() => { });

    // Load config and locations from API
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        if (data.locations && data.locations.length > 0) {
          setLocations(data.locations);
        }
        if (data.config) {
          setResortConfig(data.config);
        }
      })
      .catch(e => console.error("Error loading data from API:", e))
      .finally(() => setIsDataLoaded(true));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.user) {
        setCurrentUser({
          id: data.user.username,
          username: data.user.username,
          password: '',
          role: data.user.role,
          fullName: data.user.fullName,
        });
        setPassword('');
      } else {
        setError(data.error || 'Tài khoản hoặc mật khẩu không đúng');
      }
    } catch (_e) {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    } catch (_e) {
      // ignore network errors during logout
    }
    setCurrentUser(null);
  };

  const handleSaveAllData = (newLocs: LocationItem[], newCfg: ResortConfig) => {
    setLocations(newLocs);
    setResortConfig(newCfg);
    try {
      localStorage.setItem('cliff_resort_locations_v2', JSON.stringify(newLocs));
      localStorage.setItem('cliff_resort_config_v2', JSON.stringify(newCfg));
    } catch (e) {
      console.warn("LocalStorage write error:", e);
    }
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ locations: newLocs, config: newCfg })
    }).catch(e => console.error("Error saving data:", e));
  };

  const handleResetToDefault = () => {
    setLocations(INITIAL_LOCATIONS);
    setResortConfig(DEFAULT_RESORT_CONFIG);
    localStorage.removeItem('cliff_resort_locations_v2');
    localStorage.removeItem('cliff_resort_config_v2');
  };

  const saveUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    localStorage.setItem('cliff_users', JSON.stringify(newUsers));
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#1A365D] rounded-2xl mx-auto flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-[#C5A059]" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#1A365D]">Đăng nhập hệ thống</h1>
            <p className="text-gray-500 mt-2 text-sm">Quản lý sơ đồ 3D The Cliff Resort</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] outline-none"
                placeholder="demo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] outline-none"
                placeholder="demo"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-[#1A365D] hover:bg-[#2A4365] text-white font-bold rounded-xl shadow-md transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-serif font-bold text-[#1A365D] text-lg">Hệ Thống Quản Trị</h1>
            <div className="h-6 w-px bg-gray-200"></div>
            <nav className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('panel')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'panel' ? 'bg-[#1A365D] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Quản lý bản đồ
              </button>
              {(currentUser.role === 'admin' || currentUser.role === 'editor') && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-[#1A365D] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Tài khoản
                </button>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <UserIcon className="w-4 h-4 text-[#C5A059]" />
              <span className="font-medium">{currentUser.fullName}</span>
              <span className="text-xs uppercase bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">{currentUser.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              Đăng xuất
            </button>
            <a
              href="/"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Trang chính
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        {!isDataLoaded ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 flex flex-col items-center justify-center gap-4 text-[#1A365D]" style={{ minHeight: '60vh' }}>
            <div className="w-8 h-8 border-3 border-[#1A365D] border-t-transparent rounded-full animate-spin" />
            <p className="font-serif font-bold text-sm">Đang tải dữ liệu bản đồ...</p>
          </div>
        ) : activeTab === 'panel' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative" style={{ minHeight: '80vh' }}>
            <AdminPanel
              locations={locations}
              resortConfig={resortConfig}
              onSaveAll={handleSaveAllData}
              onResetToDefault={handleResetToDefault}
              onClose={() => { }} // Not needed in fullscreen
              onStartPinCalibration={() => { }} // Calibrating might need the map view, which is tricky in full page without the map. We'll handle it.
              calibratingLocationId={null}
              isFullScreen={true}
              userRole={currentUser.role}
            />
          </div>
        ) : (
          <AdminUsersTab users={users} onSaveUsers={saveUsers} currentUser={currentUser} />
        )}
      </main>
    </div>
  );
};
