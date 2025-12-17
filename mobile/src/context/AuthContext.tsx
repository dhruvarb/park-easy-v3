import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../services/api';

type AuthType = {
    user: any | null;
    isLoading: boolean;
    signIn: (token: string, user: any) => Promise<void>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthType>({
    user: null,
    isLoading: false,
    signIn: async () => { },
    signOut: async () => { },
    refreshUser: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const token = await SecureStore.getItemAsync('pe_token');
            if (token) {
                try {
                    const userData = await authApi.me();
                    setUser(userData.user);
                } catch (err) {
                    console.log("Token invalid or network error", err);
                    await SecureStore.deleteItemAsync('pe_token');
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const signIn = async (token: string, newUser: any) => {
        await SecureStore.setItemAsync('pe_token', token);
        setUser(newUser);
    };

    const signOut = async () => {
        await SecureStore.deleteItemAsync('pe_token');
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const userData = await authApi.me();
            setUser(userData.user);
        } catch (error) {
            console.error("Failed to refresh user", error);
        }
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signOut, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
