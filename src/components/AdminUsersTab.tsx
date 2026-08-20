import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Edit2, Trash2, Plus, X, Save } from 'lucide-react';

interface AdminUsersTabProps {
  users: User[];
  onSaveUsers: (users: User[]) => void;
  currentUser: User;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ users, onSaveUsers, currentUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});
  
  const canEdit = currentUser.role === 'admin';

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setEditingUser({ id: Date.now().toString(), role: 'user', username: '', fullName: '', password: '' });
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      onSaveUsers(users.filter(u => u.id !== id));
    }
  };

  const handleSave = () => {
    if (!editingUser.username || !editingUser.fullName) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    
    if (editingUser.id && users.some(u => u.id === editingUser.id)) {
      onSaveUsers(users.map(u => u.id === editingUser.id ? editingUser as User : u));
    } else {
      onSaveUsers([...users, editingUser as User]);
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#1A365D]">Quản lý Tài khoản</h2>
          <p className="text-sm text-gray-500 mt-1">Thêm, sửa, xóa người dùng và phân quyền</p>
        </div>
        {canEdit && (
          <button 
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A365D] hover:bg-[#2A4365] text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Thêm tài khoản
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 uppercase font-medium border-y border-gray-200">
            <tr>
              <th className="px-4 py-3">Họ tên</th>
              <th className="px-4 py-3">Tên đăng nhập</th>
              <th className="px-4 py-3">Phân quyền</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-900">{user.fullName}</td>
                <td className="px-4 py-3">{user.username}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-md uppercase tracking-wider
                    ${user.role === 'admin' ? 'bg-red-100 text-red-700' : 
                      user.role === 'editor' ? 'bg-blue-100 text-blue-700' : 
                      'bg-gray-100 text-gray-700'}`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {canEdit && (
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        disabled={user.id === currentUser.id}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-serif font-bold text-[#1A365D]">
                {editingUser.id && users.some(u => u.id === editingUser.id) ? 'Sửa thông tin' : 'Thêm tài khoản mới'}
              </h3>
              <button onClick={() => setIsEditing(false)} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Họ tên *</label>
                <input 
                  type="text" 
                  value={editingUser.fullName || ''}
                  onChange={e => setEditingUser({...editingUser, fullName: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#C5A059] outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tên đăng nhập *</label>
                <input 
                  type="text" 
                  value={editingUser.username || ''}
                  onChange={e => setEditingUser({...editingUser, username: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#C5A059] outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Mật khẩu {editingUser.id && users.some(u => u.id === editingUser.id) ? '(để trống nếu không đổi)' : '*'}</label>
                <input 
                  type="text" 
                  value={editingUser.password || ''}
                  onChange={e => setEditingUser({...editingUser, password: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#C5A059] outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phân quyền</label>
                <select 
                  value={editingUser.role || 'user'}
                  onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#C5A059] outline-none"
                >
                  <option value="admin">Quản trị viên (Admin)</option>
                  <option value="editor">Biên tập viên (Editor)</option>
                  <option value="user">Người dùng (User)</option>
                </select>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium bg-[#1A365D] text-white hover:bg-[#2A4365] rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Lưu lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
