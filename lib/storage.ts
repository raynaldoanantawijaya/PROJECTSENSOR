import { db, initFirebase } from "./firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, query } from "firebase/firestore";

export interface Sensor {
    id: string;
    name: string;
    type: 'speed' | 'sack' | 'kwh';
    status: 'active' | 'inactive' | 'maintenance';
    unit?: string;
    firebaseConfig?: string; // JSON string for flexibility
    firebasePath?: string;
    spreadsheetUrl?: string; // Google Sheet URL for Reports
}

export interface User {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'user';
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

export const storageService = {
    init: async () => {
        await initFirebase();
    },

    getSensors: async (): Promise<Sensor[]> => {
        try {
            const querySnapshot = await getDocs(collection(db, "sensors"));
            const sensors: Sensor[] = [];
            querySnapshot.forEach((doc) => {
                sensors.push(doc.data() as Sensor);
            });
            // No seeding logic anymore
            return sensors;
        } catch (error) {
            console.error("Error fetching sensors:", error);
            return [];
        }
    },

    saveSensor: async (sensor: Sensor) => {
        try {
            await setDoc(doc(db, "sensors", sensor.id), sensor);
            return sensor;
        } catch (error) {
            console.error("Error saving sensor:", error);
            throw error;
        }
    },

    deleteSensor: async (id: string) => {
        try {
            await deleteDoc(doc(db, "sensors", id));
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

    getUsers: async (): Promise<User[]> => {
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
                return DEFAULT_USERS;
            }
            return users;
        } catch (error) {
            console.error("Error fetching users:", error);
            return [];
        }
    },

    saveUser: async (user: User) => {
        try {
            await setDoc(doc(db, "users", user.id), user);
            return user;
        } catch (error) {
            console.error("Error saving user:", error);
            throw error;
        }
    },

    deleteUser: async (id: string) => {
        try {
            await deleteDoc(doc(db, "users", id));
        } catch (error) {
            console.error("Error deleting user:", error);
            throw error;
        }
    }
};

