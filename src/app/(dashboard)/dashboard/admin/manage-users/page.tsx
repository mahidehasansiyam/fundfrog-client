'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  photoURL: string;
  role: string;
  credits: number;
  createdAt: string;
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.users()
      .then((res) => setUsers(res.users))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const refresh = () => {
    setLoading(true);
    adminApi.users()
      .then((res) => setUsers(res.users))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await adminApi.updateUserRole(id, role);
      toast.success('User role updated');
      refresh();
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user? This action cannot be undone.')) return;
    try {
      await adminApi.deleteUser(id);
      toast.success('User deleted');
      refresh();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Manage Users</h1>
      <p className="text-gray-500 text-sm mb-6">View, update roles, and remove users</p>

      <div className="responsive-table overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a3a]">
              <th className="text-left py-3 px-4 text-gray-500 font-medium">User</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Email</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Role</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Credits</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Joined</th>
              <th className="text-right py-3 px-4 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[#1a1a28] hover:bg-[#0f0f18]">
                <td data-label="User" className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white">{u.name}</span>
                  </div>
                </td>
                <td data-label="Email" className="py-3 px-4 text-gray-400">{u.email}</td>
                <td data-label="Role" className="py-3 px-4">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="supporter">Supporter</option>
                    <option value="creator">Creator</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td data-label="Credits" className="py-3 px-4 text-white">{u.credits.toLocaleString()}</td>
                <td data-label="Joined" className="py-3 px-4 text-gray-500">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                </td>
                <td data-label="Actions" className="py-3 px-4 text-right">
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
