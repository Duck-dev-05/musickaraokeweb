const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL;
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY;

if (!ADMIN_API_URL) {
  throw new Error('NEXT_PUBLIC_ADMIN_API_URL is not set');
}
if (!ADMIN_API_KEY) {
  throw new Error('NEXT_PUBLIC_ADMIN_API_KEY is not set');
}

export async function fetchAdminUsers() {
  const res = await fetch(`${ADMIN_API_URL}/api/admin-users`, {
    headers: {
      'x-admin-api-key': ADMIN_API_KEY,
    },
    next: { revalidate: 60 }, // cache for 1 min
  });
  if (!res.ok) throw new Error('Failed to fetch admin users');
  return res.json();
}

export async function createAdminUser(user: any) {
  const res = await fetch(`${ADMIN_API_URL}/api/admin-users`, {
    method: 'POST',
    headers: {
      'x-admin-api-key': ADMIN_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error('Failed to create admin user');
  return res.json();
}

export async function updateAdminUser(user: any) {
  const res = await fetch(`${ADMIN_API_URL}/api/admin-users`, {
    method: 'PUT',
    headers: {
      'x-admin-api-key': ADMIN_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error('Failed to update admin user');
  return res.json();
}

export async function deleteAdminUser(user: any) {
  const res = await fetch(`${ADMIN_API_URL}/api/admin-users`, {
    method: 'DELETE',
    headers: {
      'x-admin-api-key': ADMIN_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error('Failed to delete admin user');
  return res.json();
}

export async function fetchAdminPlaylists() {
  const res = await fetch(`${ADMIN_API_URL}/api/admin-playlists`, {
    headers: {
      'x-admin-api-key': ADMIN_API_KEY,
    },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error('Failed to fetch admin playlists');
  return res.json();
}

export async function fetchAdminSongs() {
  const res = await fetch(`${ADMIN_API_URL}/api/admin-songs`, {
    headers: {
      'x-admin-api-key': ADMIN_API_KEY,
    },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error('Failed to fetch admin songs');
  return res.json();
} 