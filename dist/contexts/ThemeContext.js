import React, { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext(null);
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
export function ThemeProvider({ children }) {
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });
    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
        if (darkMode) {
            document.documentElement.classList.add('dark');
        }
        else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);
    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };
    return (React.createElement(ThemeContext.Provider, { value: { darkMode, toggleDarkMode } }, children));
}
