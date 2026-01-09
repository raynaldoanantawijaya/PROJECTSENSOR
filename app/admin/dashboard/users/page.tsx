"use client";

import React, { useEffect, useState } from 'react';
import { storageService, User } from '@/lib/storage';
import { authService } from '@/lib/auth';

const COMMANDER_EMAIL = process.env.NEXT_PUBLIC_COMMANDER_EMAIL || "anantawijaya212@gmail.com";
const COMMANDER_NAME = process.env.NEXT_PUBLIC_COMMANDER_NAME || "RAYNALDO ANANTA WIJAYA";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    // Add simpler state for immediate email check
    const [currentEmail, setCurrentEmail] = useState<string>("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [newUser, setNewUser] = useState<Partial<User> & { password?: string }>({
        username: '',
        email: '',
        role: 'user',
        permissions: { viewSpeed: true, viewSack: true, viewKwh: true, canEdit: false },
        password: ''
    });

    useEffect(() => {
        const loadData = async () => {
            await storageService.init();
            const allFetchedUsers = await storageService.getUsers();

            // 1. Get Current User from Firebase Auth Source of Truth
            const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
                const emailFromAuth = firebaseUser?.email || "";
                setCurrentEmail(emailFromAuth);

                if (emailFromAuth) {
                    const foundUser = allFetchedUsers.find(u =>
                        u.email.toLowerCase().trim() === emailFromAuth.toLowerCase().trim()
                    );
                    // If found in DB use it, otherwise mock one from Auth (for fresh commander setup)
                    setCurrentUser(foundUser || {
                        id: firebaseUser!.uid,
                        username: firebaseUser!.displayName || 'Admin',
                        email: emailFromAuth,
                        role: 'admin',
                        permissions: { viewSpeed: true, viewSack: true, viewKwh: true, canEdit: true }
                    });
                }
            });

            // 2. Sort users
            allFetchedUsers.sort((a, b) => {
                const cmdEmail = COMMANDER_EMAIL.toLowerCase();
                const aEmail = (a.email || "").toLowerCase();
                const bEmail = (b.email || "").toLowerCase();

                if (aEmail === cmdEmail) return -1;
                if (bEmail === cmdEmail) return 1;
                if (a.role === 'admin' && b.role !== 'admin') return -1;
                if (b.role === 'admin' && a.role !== 'admin') return 1;
                return a.username.localeCompare(b.username);
            });
            setUsers(allFetchedUsers);

            return () => unsubscribe();
        };
        loadData();
    }, []);

    // Derived state for Commander Access
    // We check BOTH the full user object AND the raw email state to be absolutely sure
    const isCommanderLoggedIn =
        (currentUser?.email?.toLowerCase().trim() === COMMANDER_EMAIL.toLowerCase().trim()) ||
        (currentEmail.toLowerCase().trim() === COMMANDER_EMAIL.toLowerCase().trim());

    // Permission Check
    const hasEditPermission = isCommanderLoggedIn || (currentUser?.permissions?.canEdit === true) || (currentUser?.subRole === 'all');

    const handleAddUser = async () => {
        if (!hasEditPermission) {
            alert("Access Denied: You do not have permission to create users.");
            return;
        }

        if (!newUser.username || !newUser.email || !newUser.password) {
            alert("Name, Email, and Password are required");
            return;
        }

        // Security check
        if (newUser.role === 'admin' && !isCommanderLoggedIn) {
            alert("Only the Commander can create new Administrators.");
            return;
        }

        try {
            const { createUserAction } = await import('@/app/actions/auth-actions');
            const result = await createUserAction(newUser.email, newUser.password, newUser.username);

            if (!result.success) {
                alert("Failed to create account: " + result.error);
                return;
            }

            // INHERITANCE LOGIC
            let finalPermissions = newUser.permissions!;
            let finalSubRole = newUser.subRole;

            // If creator is NOT Commander and has a specific sub-role, enforce inheritance
            if (!isCommanderLoggedIn && currentUser?.subRole && currentUser.subRole !== 'all') {
                finalSubRole = currentUser.subRole;
                // Lock permissions to only their department
                finalPermissions = {
                    viewSpeed: currentUser.subRole === 'printing',
                    viewSack: currentUser.subRole === 'sylum',
                    viewKwh: currentUser.subRole === 'listrik',
                    canEdit: false
                };
            }

            const user: User = {
                id: result.uid!,
                username: newUser.username!,
                email: newUser.email!,
                role: newUser.role as 'admin' | 'user',
                permissions: finalPermissions
            };

            if (finalSubRole) {
                user.subRole = finalSubRole;
            }

            await storageService.saveUser(user);

            // Reload
            const updatedUsers = await storageService.getUsers();
            updatedUsers.sort((a, b) => {
                const cmdEmail = COMMANDER_EMAIL.toLowerCase();
                if (a.email.toLowerCase() === cmdEmail) return -1;
                if (b.email.toLowerCase() === cmdEmail) return 1;
                if (a.role === 'admin' && b.role !== 'admin') return -1;
                if (b.role === 'admin' && a.role !== 'admin') return 1;
                return a.username.localeCompare(b.username);
            });
            setUsers(updatedUsers);

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

    const handleDeleteUser = async (targetUser: User) => {
        if (!hasEditPermission) {
            alert("Access Denied: You do not have permission to delete users.");
            return;
        }

        if (targetUser.email.toLowerCase() === COMMANDER_EMAIL.toLowerCase()) {
            alert("Cannot delete the Commander.");
            return;
        }

        if (targetUser.role === 'admin' && !isCommanderLoggedIn) {
            alert("Access Denied: You cannot delete another Administrator.");
            return;
        }

        // Sub-Role Protection: Only 'All' Admin or Commander can delete 'All' SubRole users
        if (targetUser.subRole === 'all' && currentUser?.subRole !== 'all' && !isCommanderLoggedIn) {
            alert("Access Denied: users with 'All Access' (Sub-Role All) can only be managed by All-Access Admins or Commander.");
            return;
        }

        if (confirm(`Are you sure you want to delete user ${targetUser.username}? This cannot be undone.`)) {
            try {
                const { deleteUserAction } = await import('@/app/actions/auth-actions');
                const result = await deleteUserAction(targetUser.id);

                if (!result.success) {
                    console.error("Failed to delete from Auth:", result.error);
                    alert("Warning: Could not delete user from Authentication provider. " + result.error);
                }

                await storageService.deleteUser(targetUser.id);

                // Refresh list
                const freshUsers = await storageService.getUsers();
                // Apply sort again
                freshUsers.sort((a, b) => {
                    const cmdEmail = COMMANDER_EMAIL.toLowerCase();
                    if (a.email.toLowerCase() === cmdEmail) return -1;
                    if (b.email.toLowerCase() === cmdEmail) return 1;
                    if (a.role === 'admin' && b.role !== 'admin') return -1;
                    if (b.role === 'admin' && a.role !== 'admin') return 1;
                    return a.username.localeCompare(b.username);
                });
                setUsers(freshUsers);

            } catch (e) {
                console.error("Delete failed:", e);
                alert("Failed to delete user completely.");
            }
        }
    };

    const handleRoleChange = async (targetUser: User, newRole: string) => {
        if (!isCommanderLoggedIn) return; // Guard
        if (targetUser.email.toLowerCase() === COMMANDER_EMAIL.toLowerCase()) return; // Guard Commander

        try {
            const updatedUser = { ...targetUser, role: newRole as 'admin' | 'user' };
            await storageService.saveUser(updatedUser);
            // Optimistic update
            setUsers(prev => prev.map(u => u.id === targetUser.id ? updatedUser : u));
        } catch (e) {
            console.error(e);
            alert("Failed to update role");
        }
    };

    const handleSubRoleChange = async (targetUser: User, newSubRole: string) => {
        if (!isCommanderLoggedIn) return; // Only Commander
        if (targetUser.email.toLowerCase() === COMMANDER_EMAIL.toLowerCase()) return;

        try {
            const updatedUser: User = {
                ...targetUser,
                subRole: newSubRole as any
            };
            await storageService.saveUser(updatedUser);
            setUsers(prev => prev.map(u => u.id === targetUser.id ? updatedUser : u));
        } catch (e) {
            console.error(e);
            alert("Failed to update sub-role");
        }
    };

    const handlePermissionChange = async (targetUser: User, key: keyof User['permissions']) => {
        if (targetUser.email.toLowerCase() === COMMANDER_EMAIL.toLowerCase()) return;

        // General edit check
        if (!hasEditPermission) {
            alert("Access Denied: You do not have permission to modify users.");
            return;
        }

        if (targetUser.role === 'admin' && !isCommanderLoggedIn) {
            alert("Access Denied: You cannot modify permissions of another Administrator.");
            return;
        }

        // Sub-Role Protection: Only 'All' Admin or Commander can delete 'All' SubRole users
        if (targetUser.subRole === 'all' && currentUser?.subRole !== 'all' && !isCommanderLoggedIn) {
            alert("Access Denied: users with 'All Access' (Sub-Role All) can only be managed by All-Access Admins or Commander.");
            return;
        }

        // Sub-Role Permission Guards
        const mySubRole = currentUser?.subRole;
        if (mySubRole && mySubRole !== 'all') {
            if (mySubRole === 'printing' && key !== 'viewSpeed') {
                alert("Access Denied: Printing Admin can only manage Speed Sensors.");
                return;
            }
            if (mySubRole === 'sylum' && key !== 'viewSack') {
                alert("Access Denied: Sylum Admin can only manage Sack Sensors.");
                return;
            }
            if (mySubRole === 'listrik' && key !== 'viewKwh') {
                alert("Access Denied: Listrik Admin can only manage KWH Sensors.");
                return;
            }
        }

        const updatedUser = {
            ...targetUser,
            permissions: {
                ...targetUser.permissions,
                [key]: !targetUser.permissions[key]
            }
        };
        await storageService.saveUser(updatedUser);
        setUsers(users.map(u => u.id === targetUser.id ? updatedUser : u));
    };

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
                                    className="bg-[#111722] border border-[#3b4b68] text-white rounded px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-50"
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value as 'user' | 'admin' })}
                                    disabled={!isCommanderLoggedIn}
                                >
                                    <option value="user">User</option>
                                    {isCommanderLoggedIn && <option value="admin">Admin</option>}
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
                                    {users.map((targetUser) => {
                                        const isCommanderTarget = targetUser.email.toLowerCase().trim() === COMMANDER_EMAIL.toLowerCase().trim();
                                        const displayName = isCommanderTarget ? COMMANDER_NAME : targetUser.username;
                                        const displayRole = isCommanderTarget ? "COMMANDER" : targetUser.role;

                                        // Permission Logic
                                        const isTargetAdmin = targetUser.role === 'admin';

                                        // Update canModify Logic here
                                        const isTargetAllAccess = targetUser.subRole === 'all';
                                        const isMeAllAccess = currentUser?.subRole === 'all';

                                        let canModify = false;
                                        if (isCommanderLoggedIn) {
                                            canModify = !isCommanderTarget;
                                        } else if (isTargetAdmin) {
                                            canModify = false;
                                        } else {
                                            // Normal Check + Sub Role Protection
                                            if (isTargetAllAccess && !isMeAllAccess) {
                                                canModify = false; // Protected Target
                                            } else {
                                                canModify = hasEditPermission;
                                            }
                                        }


                                        // Scope Permission Checks
                                        const mySub = currentUser?.subRole;
                                        const canTouchSpeed = !mySub || mySub === 'all' || mySub === 'printing';
                                        const canTouchSack = !mySub || mySub === 'all' || mySub === 'sylum';
                                        const canTouchKwh = !mySub || mySub === 'all' || mySub === 'listrik';


                                        // Role Color Logic
                                        let roleColorClass = "bg-blue-400/10 text-blue-400 ring-blue-400/20";
                                        if (isCommanderTarget) roleColorClass = "bg-amber-400/10 text-amber-400 ring-amber-400/20";
                                        else if (targetUser.role === 'admin') roleColorClass = "bg-purple-400/10 text-purple-400 ring-purple-400/20";

                                        return (
                                            <tr key={targetUser.id} className={`group transition-colors ${isCommanderTarget ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-white/[0.02]'}`}>
                                                <td className="p-5 align-top">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border 
                                                            ${isCommanderTarget
                                                                ? 'bg-amber-500/20 text-amber-500 border-amber-500/20'
                                                                : 'bg-slate-500/20 text-slate-400 border-slate-500/20'}`}>
                                                            {displayName.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className={`font-medium text-sm ${isCommanderTarget ? 'text-amber-400' : 'text-white'}`}>{displayName}</p>
                                                            <p className="text-[#92a4c9] text-xs">{targetUser.email}</p>

                                                            <div className="mt-1 flex flex-col gap-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${roleColorClass}`}>
                                                                        <span className="uppercase">{displayRole}</span>
                                                                    </span>

                                                                    {/* COMMANDER ONLY: Change Role */}
                                                                    {isCommanderLoggedIn && !isCommanderTarget && (
                                                                        <select
                                                                            className="bg-[#111722] text-[#92a4c9] text-[10px] border border-white/10 rounded px-1 py-0.5 focus:outline-none focus:border-primary cursor-pointer hover:bg-[#1a2336] transition-colors"
                                                                            value={targetUser.role}
                                                                            onChange={(e) => handleRoleChange(targetUser, e.target.value)}
                                                                        >
                                                                            <option value="user">User</option>
                                                                            <option value="admin">Admin</option>
                                                                        </select>
                                                                    )}
                                                                </div>

                                                                {/* SUB ROLE DISPLAY / EDIT */}
                                                                {!isCommanderTarget && (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] text-[#92a4c9] uppercase tracking-wider font-semibold">
                                                                            {targetUser.subRole ? targetUser.subRole : 'No Role'}
                                                                        </span>
                                                                        {isCommanderLoggedIn && (
                                                                            <select
                                                                                className="bg-[#111722] text-amber-400 text-[10px] border border-amber-500/20 rounded px-1 py-0.5 focus:outline-none focus:border-amber-500 cursor-pointer hover:bg-[#1a2336]"
                                                                                value={targetUser.subRole || ''}
                                                                                onChange={(e) => handleSubRoleChange(targetUser, e.target.value)}
                                                                            >
                                                                                <option value="">No Sub-Role</option>
                                                                                <option value="printing">Printing (Speed)</option>
                                                                                <option value="sylum">Sylum (Sack)</option>
                                                                                <option value="listrik">Listrik (KWH)</option>
                                                                                <option value="all">All Access</option>
                                                                            </select>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5 align-top">
                                                    <div className={`bg-[#111722]/50 rounded-lg p-3 border border-white/5`}>
                                                        <p className="text-xs text-[#92a4c9] mb-3 uppercase font-semibold">Allowed Sensors:</p>
                                                        {isCommanderTarget ? (
                                                            <div className="flex items-center justify-center py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                                                <span className="material-symbols-outlined text-amber-500 mr-2 text-[18px]">verified_user</span>
                                                                <span className="text-amber-500 font-bold text-xs tracking-widest uppercase">FULL ACCESS SYSTEM</span>
                                                            </div>
                                                        ) : (
                                                            <div className={`grid grid-cols-2 gap-3 ${!canModify ? 'opacity-50 pointer-events-none' : ''}`}>
                                                                <label className={`flex items-center space-x-2 cursor-pointer group/chk ${!canTouchSpeed ? 'opacity-30 pointer-events-none' : ''}`}>
                                                                    <input
                                                                        checked={targetUser.permissions.viewSpeed}
                                                                        onChange={() => handlePermissionChange(targetUser, 'viewSpeed')}
                                                                        className="custom-checkbox"
                                                                        type="checkbox"
                                                                        disabled={!canModify || !canTouchSpeed}
                                                                    />
                                                                    <span className="text-sm text-gray-300 group-hover/chk:text-white transition-colors">Sensor Kecepatan</span>
                                                                </label>
                                                                <label className={`flex items-center space-x-2 cursor-pointer group/chk ${!canTouchSack ? 'opacity-30 pointer-events-none' : ''}`}>
                                                                    <input
                                                                        checked={targetUser.permissions.viewSack}
                                                                        onChange={() => handlePermissionChange(targetUser, 'viewSack')}
                                                                        className="custom-checkbox"
                                                                        type="checkbox"
                                                                        disabled={!canModify || !canTouchSack}
                                                                    />
                                                                    <span className="text-sm text-gray-300 group-hover/chk:text-white transition-colors">Sensor Karung</span>
                                                                </label>
                                                                <label className={`flex items-center space-x-2 cursor-pointer group/chk ${!canTouchKwh ? 'opacity-30 pointer-events-none' : ''}`}>
                                                                    <input
                                                                        checked={targetUser.permissions.viewKwh}
                                                                        onChange={() => handlePermissionChange(targetUser, 'viewKwh')}
                                                                        className="custom-checkbox"
                                                                        type="checkbox"
                                                                        disabled={!canModify || !canTouchKwh}
                                                                    />
                                                                    <span className="text-sm text-gray-300 group-hover/chk:text-white transition-colors">Sensor KWH</span>
                                                                </label>

                                                                {/* SPECIAL: Edit Permission - ONLY COMMANDER CAN CHANGE */}
                                                                <label className={`flex items-center space-x-2 cursor-pointer group/chk ${!isCommanderLoggedIn ? 'opacity-50 pointer-events-none' : ''}`}>
                                                                    <input
                                                                        checked={targetUser.permissions.canEdit}
                                                                        onChange={() => isCommanderLoggedIn && handlePermissionChange(targetUser, 'canEdit')}
                                                                        className="custom-checkbox !accent-amber-500"
                                                                        type="checkbox"
                                                                        disabled={!isCommanderLoggedIn}
                                                                    />
                                                                    <span className={`text-sm transition-colors ${targetUser.permissions.canEdit ? 'text-amber-400 font-medium' : 'text-gray-300'}`}>
                                                                        Izin Edit
                                                                    </span>
                                                                    {!isCommanderLoggedIn && <span className="material-symbols-outlined text-[10px] text-gray-500">lock</span>}
                                                                </label>
                                                            </div>
                                                        )}
                                                        {!canModify && !isCommanderTarget && (
                                                            <p className="text-[10px] text-red-400 mt-2 italic flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[12px]">lock</span>
                                                                Admin access protected
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-5 align-top text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {canModify && (
                                                            <button
                                                                onClick={() => handleDeleteUser(targetUser)}
                                                                className="p-2 hover:bg-red-500/20 text-[#92a4c9] hover:text-red-500 rounded-lg transition-colors" title="Delete User"
                                                            >
                                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
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
