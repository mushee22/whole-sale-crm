import React, { createContext, useContext, useState, useEffect } from "react";
import { getUser, type User } from "../features/auth/api/auth";

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: Error | null;
    login: (token: string, user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token');
            console.log("AuthContext: initAuth starting. Token:", storedToken ? "Exists" : "Missing");

            if (storedToken) {
                try {
                    setError(null);
                    const user = await getUser();
                    console.log("AuthContext: getUser success", user);
                    // const { user } = response; // Old incorrectly assumed wrapper
                    setUser(user);
                    setToken(storedToken);
                } catch (err: any) {
                    console.error("AuthContext: Failed to fetch user:", err);

                    if (err.response?.status === 401) {
                        // Official logout
                        localStorage.removeItem('token');
                        localStorage.removeItem('user_role');
                        setToken(null);
                        setUser(null);
                    } else {
                        // Network/Server error - keep token, set error state
                        setError(err);
                        // Do NOT clear token/user here if you want to allow retry
                        // But user is null by default.
                    }
                }
            } else {
                setToken(null);
                setUser(null);
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = (newToken: string, newUser: User) => {
        localStorage.removeItem('token'); // Clear old
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
        setError(null);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_role');
        setToken(null);
        setUser(null);
        setError(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!user,
            isLoading,
            error,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
