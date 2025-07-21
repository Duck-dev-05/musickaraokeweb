import React, { useEffect, useState } from 'react';
import {
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from '../lib/api/admin';

interface User {
  id?: number;
  name: string;
  email: string;
  role: string;
  status?: string;
  joinDate?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [editing, setEditing] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const user = await createAdminUser({ name, email, role });
      setUsers((prev) => [...prev, user]);
      setName('');
      setEmail('');
      setRole('user');
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      const updated = await updateAdminUser(editing);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setEditing(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    }
  }

  async function handleDelete(id?: number) {
    if (!id) return;
    if (!window.confirm('Delete this user?')) return;
    try {
      await deleteAdminUser({ id });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">User Management (Admin API)</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="w-full mb-8 border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-2">{editing?.id === user.id ? (
                  <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                ) : user.name}</td>
                <td className="p-2">{editing?.id === user.id ? (
                  <input value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} />
                ) : user.email}</td>
                <td className="p-2">{editing?.id === user.id ? (
                  <select value={editing.role} onChange={e => setEditing({ ...editing, role: e.target.value })}>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                ) : user.role}</td>
                <td className="p-2">
                  {editing?.id === user.id ? (
                    <>
                      <button className="text-blue-600 mr-2" onClick={handleUpdate}>Save</button>
                      <button className="text-gray-600" onClick={() => setEditing(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="text-blue-600 mr-2" onClick={() => setEditing(user)}>Edit</button>
                      <button className="text-red-600" onClick={() => handleDelete(user.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <form onSubmit={editing ? handleUpdate : handleCreate} className="space-y-4">
        <h2 className="text-lg font-semibold mb-2">{editing ? 'Edit User' : 'Add User'}</h2>
        <input
          className="border p-2 rounded w-full"
          placeholder="Name"
          value={editing ? editing.name : name}
          onChange={e => editing ? setEditing({ ...editing, name: e.target.value }) : setName(e.target.value)}
          required
        />
        <input
          className="border p-2 rounded w-full"
          placeholder="Email"
          value={editing ? editing.email : email}
          onChange={e => editing ? setEditing({ ...editing, email: e.target.value }) : setEmail(e.target.value)}
          required
        />
        <select
          className="border p-2 rounded w-full"
          value={editing ? editing.role : role}
          onChange={e => editing ? setEditing({ ...editing, role: e.target.value }) : setRole(e.target.value)}
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          {editing ? 'Update User' : 'Add User'}
        </button>
        {editing && (
          <button type="button" className="ml-2 text-gray-600" onClick={() => setEditing(null)}>
            Cancel
          </button>
        )}
      </form>
    </div>
  );
} 