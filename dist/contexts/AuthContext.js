var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { createContext, useContext, useEffect, useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut, } from 'firebase/auth';
import { auth, googleProvider, db } from '../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
const AuthContext = createContext(null);
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const createUserDocument = (user) => __awaiter(this, void 0, void 0, function* () {
        const userRef = doc(db, 'users', user.uid);
        yield setDoc(userRef, {
            email: user.email,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            createdAt: serverTimestamp(),
        }, { merge: true });
    });
    function signup(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const userCredential = yield createUserWithEmailAndPassword(auth, email, password);
            yield createUserDocument(userCredential.user);
        });
    }
    function login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            yield signInWithEmailAndPassword(auth, email, password);
        });
    }
    function loginWithGoogle() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield signInWithPopup(auth, googleProvider);
            yield createUserDocument(result.user);
        });
    }
    function logout() {
        return __awaiter(this, void 0, void 0, function* () {
            yield signOut(auth);
        });
    }
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);
    const value = {
        currentUser,
        loading,
        login,
        signup,
        loginWithGoogle,
        logout,
    };
    return (React.createElement(AuthContext.Provider, { value: value }, !loading && children));
}
