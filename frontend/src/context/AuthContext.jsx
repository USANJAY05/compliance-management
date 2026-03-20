import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null); // {id: '...', role: '...'}

    useEffect(() => {
        const saved = localStorage.getItem('compliance_user');
        if (saved) {
            setCurrentUser(JSON.parse(saved));
        }
    }, []);

    const login = (user) => {
        setCurrentUser(user);
        localStorage.setItem('compliance_user', JSON.stringify(user));
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('compliance_user');
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
