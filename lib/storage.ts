import { db, initFirebase } from "./firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, query, onSnapshot } from "firebase/firestore";

export interface Sensor {
    id: string;
    name: string;
    type: 'speed' | 'sack' | 'kwh';
    status: 'active' | 'inactive' | 'maintenance';
    unit?: string;
    firebaseConfig?: string; // JSON string for flexibility
    firebasePath?: string;
    spreadsheetUrl?: string; // Google Sheet URL for Reports
    targetValue?: number; // Ideal target value (e.g. 50cm width)
    tolerance?: number; // Allowed deviation (e.g. 1cm)
    // Sack sensor specific Firebase RTDB paths
    sackPathLebar?: string;     // e.g. mesin104/lebar
    sackPathOffset?: string;    // e.g. mesin104/offset
    sackPathIr1?: string;       // e.g. mesin104/ir1
    sackPathIr2?: string;       // e.g. mesin104/ir2
    sackPathKalibrasi?: string; // e.g. mesin104/kalibrasi
}

export interface User {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'user';
    subRole?: 'printing' | 'sylum' | 'listrik' | 'all'; // Added subRole
    permissions: {
        viewSpeed: boolean;
        viewSack: boolean;
        viewKwh: boolean;
        canEdit: boolean;
    };
}

const DEFAULT_SENSORS: Sensor[] = []; // Empty default

const DEFAULT_USERS: User[] = [
    {
        id: 'fGM7wOByclYlH6N5NWScXH6DmGW2', // Using provided UID for consistency
        username: 'Admin Ananta',
        email: 'anantawijaya212@gmail.com',
        role: 'admin',
        permissions: { viewSpeed: true, viewSack: true, viewKwh: true, canEdit: true }
    },
    {
        id: 'dVKWBE0kemPISxO8FsAgRegT76E3', // Using provided UID for consistency
        username: 'User 1',
        email: 'user@gmail.com',
        role: 'user',
        permissions: { viewSpeed: true, viewSack: true, viewKwh: true, canEdit: false }
    }
];

// Simple memory cache
let cachedSensors: Sensor[] | null = null;
let cachedSensorsTime = 0;
let cachedUsers: User[] | null = null;
let cachedUsersTime = 0;
const CACHE_DURATION_MS = 10000; // 10 seconds cache

export const storageService = {
    init: async () => {
        await initFirebase();
    },

    getSensors: async (forceRefresh = false): Promise<Sensor[]> => {
        if (!forceRefresh && cachedSensors && (Date.now() - cachedSensorsTime < CACHE_DURATION_MS)) {
            return cachedSensors;
        }
        try {
            const querySnapshot = await getDocs(collection(db, "sensors"));
            const sensors: Sensor[] = [];
            querySnapshot.forEach((doc) => {
                sensors.push(doc.data() as Sensor);
            });
            // No seeding logic anymore
            cachedSensors = sensors;
            cachedSensorsTime = Date.now();
            return sensors;
        } catch (error) {
            console.error("Error fetching sensors:", error);
            return [];
        }
    },

    saveSensor: async (sensor: Sensor) => {
        try {
            await setDoc(doc(db, "sensors", sensor.id), sensor);
            cachedSensors = null; // Invalidate cache
            return sensor;
        } catch (error) {
            console.error("Error saving sensor:", error);
            throw error;
        }
    },

    deleteSensor: async (id: string) => {
        try {
            await deleteDoc(doc(db, "sensors", id));
            cachedSensors = null; // Invalidate cache
        } catch (error) {
            console.error("Error deleting sensor:", error);
            throw error;
        }
    },

    deleteAllSensors: async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "sensors"));
            const promises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(promises);
            console.log("All sensors deleted");
        } catch (error) {
            console.error("Error deleting all sensors:", error);
            throw error;
        }
    },

    getUsers: async (forceRefresh = false): Promise<User[]> => {
        if (!forceRefresh && cachedUsers && (Date.now() - cachedUsersTime < CACHE_DURATION_MS)) {
            return cachedUsers;
        }
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            const users: User[] = [];
            querySnapshot.forEach((doc) => {
                users.push(doc.data() as User);
            });

            // Seed if empty
            if (users.length === 0) {
                console.log("Seeding Users to Firebase...");
                for (const u of DEFAULT_USERS) {
                    await setDoc(doc(db, "users", u.id), u);
                }
                cachedUsers = DEFAULT_USERS;
                cachedUsersTime = Date.now();
                return DEFAULT_USERS;
            }
            cachedUsers = users;
            cachedUsersTime = Date.now();
            return users;
        } catch (error) {
            console.error("Error fetching users:", error);
            return [];
        }
    },

    saveUser: async (user: User) => {
        try {
            await setDoc(doc(db, "users", user.id), user);
            cachedUsers = null; // Invalidate cache
            return user;
        } catch (error) {
            console.error("Error saving user:", error);
            throw error;
        }
    },

    deleteUser: async (id: string) => {
        try {
            await deleteDoc(doc(db, "users", id));
            cachedUsers = null; // Invalidate cache
        } catch (error) {
            console.error("Error deleting user:", error);
            throw error;
        }
    },

    // Realtime listener for a single sensor document
    onSensorChange: (sensorId: string, callback: (sensor: Sensor | null) => void) => {
        const docRef = doc(db, "sensors", sensorId);
        return onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                callback({ id: snapshot.id, ...snapshot.data() } as Sensor);
            } else {
                callback(null);
            }
        }, (error) => {
            console.error("Sensor listener error:", error);
        });
    }
};

