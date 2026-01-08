"use client";

import React, { useEffect, useState } from 'react';
import { storageService, User } from '@/lib/storage';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newUser, setNewUser] = useState<Partial<User> & { password?: string }>({
        username: '',
        email: '',
        role: 'user',
        permissions: { viewSpeed: true, viewSack: true, viewKwh: true, canEdit: false },
        password: ''
    });

    useEffect(() => {
        const loadUsers = async () => {
            await storageService.init();
            setUsers(await storageService.getUsers());
        };
        loadUsers();
    }, []);

    const handleAddUser = async () => {
        if (!newUser.username || !newUser.email || !newUser.password) {
            alert("Name, Email, and Password are required");
            return;
        }

        try {
            // 1. Create in Firebase Auth (Server Action)
            // Note: This requires FIREBASE_SERVICE_ACCOUNT_KEY env var to be set!
            const { createUserAction } = await import('@/app/actions/auth-actions');
            const result = await createUserAction(newUser.email, newUser.password, newUser.username);

            if (!result.success) {
                alert("Failed to create account: " + result.error);
                return;
            }

            // 2. Save to Firestore (Client SDK) with the real UID
            const user: User = {
                id: result.uid!, // Use the real UID from Auth
                username: newUser.username!,
                email: newUser.email!,
                role: newUser.role as 'admin' | 'user',
                permissions: newUser.permissions!
            };

            await storageService.saveUser(user);
            setUsers(await storageService.getUsers());
            setShowAddForm(false);
            setNewUser({
                username: '',
                email: '',
                role: 'user',
                permissions: { viewSpeed: true, viewSack: true, viewKwh: true, canEdit: false },
                password: ''
            });
            alert("User created and access granted successfully!");
        } catch (e) {
            console.error(e);
            alert("Error creating user: " + e);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (confirm("Are you sure you want to revoke access for this user? This action cannot be undone.")) {
            try {
                // 1. Delete from Firebase Auth (Server Action)
                const { deleteUserAction } = await import('@/app/actions/auth-actions');
                const result = await deleteUserAction(id);

                if (!result.success) {
                    console.error("Failed to delete from Auth:", result.error);
                    alert("Warning: Could not delete user from Authentication provider. " + result.error);
                }

                // 2. Delete from Firestore/Storage
                await storageService.deleteUser(id);
                setUsers(await storageService.getUsers());
            } catch (e) {
                console.error("Delete failed:", e);
                alert("Failed to delete user completely.");
            }
        }
    };

    const handlePermissionChange = async (user: User, key: keyof User['permissions']) => {
        const updatedUser = {
            ...user,
            permissions: {
                ...user.permissions,
                [key]: !user.permissions[key]
            }
        };
        await storageService.saveUser(updatedUser);
        setUsers(await storageService.getUsers());
    };

    // Password reset removed - managed by Firebase Auth

    return (
        <>
            <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:px-12">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-white tracking-tight text-3xl font-bold leading-tight">User Management</h2>
                            <p className="text-[#92a4c9] text-base font-normal">Manage accounts and configure granular sensor access permissions.</p>
                        </div>
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg shadow-lg shadow-primary/20 transition-all font-medium text-sm"
                        >
                            <span className="material-symbols-outlined text-[20px]">{showAddForm ? 'close' : 'person_add'}</span>
                            {showAddForm ? 'Cancel' : 'Grant Access'}
                        </button>
                    </div>

                    {showAddForm && (
                        <div className="bg-[#232f48]/50 border border-white/5 rounded-xl p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                            <h3 className="text-white font-semibold mb-2">Create New User</h3>
                            <p className="text-emerald-400 text-xs mb-4 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                System will automatically create this user in Firebase Authentication.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <input
                                    className="bg-[#111722] border border-[#3b4b68] text-white rounded px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                    placeholder="Full Name / Display Name"
                                    value={newUser.username}
                                    onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                />
                                <input
                                    className="bg-[#111722] border border-[#3b4b68] text-white rounded px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                    placeholder="Email"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                />
                                <input
                                    className="bg-[#111722] border border-[#3b4b68] text-white rounded px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                    placeholder="Password"
                                    type="password"
                                    value={newUser.password || ''}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                />
                                <select
                                    className="bg-[#111722] border border-[#3b4b68] text-white rounded px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value as 'user' | 'admin' })}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex justify-end">
                                <button onClick={handleAddUser} className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Create & Grant Access</button>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-[#232f48]/50 border border-white/5">
                        <div className="relative flex-1">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#92a4c9] text-[20px]">search</span>
                            <input
                                className="w-full bg-[#111722] border border-[#3b4b68] text-white text-sm rounded-lg focus:ring-primary focus:border-primary block pl-10 p-2.5 placeholder-[#92a4c9]/50 focus:outline-none"
                                placeholder="Search users by name or email..."
                                type="text"
                            />
                        </div>
                    </div>

                    <div className="bg-[#232f48] border border-white/5 rounded-xl shadow-md overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-[#1a2336] border-b border-[#3b4b68]">
                                        <th className="p-5 text-xs font-semibold tracking-wide text-[#92a4c9] uppercase">User Details</th>
                                        <th className="p-5 text-xs font-semibold tracking-wide text-[#92a4c9] uppercase w-[40%]">Sensor Permissions</th>
                                        <th className="p-5 text-xs font-semibold tracking-wide text-[#92a4c9] uppercase text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.map((user) => (
                                        <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="p-5 align-top">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border bg-slate-500/20 text-slate-400 border-slate-500/20`}>
                                                        {user.username.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium text-sm">{user.username}</p>
                                                        <p className="text-[#92a4c9] text-xs">{user.email}</p>
                                                        <span className={`inline-flex mt-1 items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${user.role === 'admin' ? 'bg-purple-400/10 text-purple-400 ring-purple-400/20' : 'bg-blue-400/10 text-blue-400 ring-blue-400/20'}`}>
                                                            {user.role}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5 align-top">
                                                <div className={`bg-[#111722]/50 rounded-lg p-3 border border-white/5`}>
                                                    <p className="text-xs text-[#92a4c9] mb-3 uppercase font-semibold">Allowed Sensors:</p>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <label className="flex items-center space-x-2 cursor-pointer group/chk">
                                                            <input
                                                                checked={user.permissions.viewSpeed}
                                                                onChange={() => handlePermissionChange(user, 'viewSpeed')}
                                                                className="custom-checkbox"
                                                                type="checkbox"
                                                            />
                                                            <span className="text-sm text-gray-300 group-hover/chk:text-white transition-colors">Sensor Kecepatan</span>
                                                        </label>
                                                        <label className="flex items-center space-x-2 cursor-pointer group/chk">
                                                            <input
                                                                checked={user.permissions.viewSack}
                                                                onChange={() => handlePermissionChange(user, 'viewSack')}
                                                                className="custom-checkbox"
                                                                type="checkbox"
                                                            />
                                                            <span className="text-sm text-gray-300 group-hover/chk:text-white transition-colors">Sensor Karung</span>
                                                        </label>
                                                        <label className="flex items-center space-x-2 cursor-pointer group/chk">
                                                            <input
                                                                checked={user.permissions.viewKwh}
                                                                onChange={() => handlePermissionChange(user, 'viewKwh')}
                                                                className="custom-checkbox"
                                                                type="checkbox"
                                                            />
                                                            <span className="text-sm text-gray-300 group-hover/chk:text-white transition-colors">Sensor KWH</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5 align-top text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="p-2 hover:bg-red-500/20 text-[#92a4c9] hover:text-red-500 rounded-lg transition-colors" title="Delete User"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="h-10"></div>
            </main>
        </>
    );
}
