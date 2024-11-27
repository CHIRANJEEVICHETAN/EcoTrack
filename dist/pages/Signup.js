var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    function handleSubmit(e) {
        return __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            if (password !== confirmPassword) {
                return setError('Passwords do not match');
            }
            try {
                setError('');
                setLoading(true);
                yield signup(email, password);
                navigate('/profile');
            }
            catch (err) {
                console.error('Signup error:', err);
                setError(err.message || 'Failed to create an account');
            }
            setLoading(false);
        });
    }
    function handleGoogleSignIn() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                setError('');
                setLoading(true);
                yield loginWithGoogle();
                navigate('/profile');
            }
            catch (err) {
                console.error('Google Sign-in error:', err);
                setError(err.message || 'Failed to sign in with Google');
            }
            finally {
                setLoading(false);
            }
        });
    }
    return (React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex flex-col justify-center py-12 sm:px-6 lg:px-8" },
        React.createElement("div", { className: "sm:mx-auto sm:w-full sm:max-w-md" },
            React.createElement("div", { className: "text-center" },
                React.createElement("h2", { className: "text-3xl font-extrabold text-white" }, "Create an account"),
                React.createElement("p", { className: "mt-2 text-sm text-green-100" }, "Join EcoTrack and start your recycling journey"))),
        React.createElement("div", { className: "mt-8 sm:mx-auto sm:w-full sm:max-w-md" },
            React.createElement("div", { className: "bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10" },
                error && (React.createElement("div", { className: "mb-4 bg-red-50 border border-red-200 text-red-600 rounded-md p-3 text-sm" }, error)),
                React.createElement("form", { className: "space-y-6", onSubmit: handleSubmit },
                    React.createElement("div", null,
                        React.createElement("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700" }, "Email address"),
                        React.createElement("div", { className: "mt-1" },
                            React.createElement("input", { id: "email", name: "email", type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), className: "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500" }))),
                    React.createElement("div", null,
                        React.createElement("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700" }, "Password"),
                        React.createElement("div", { className: "mt-1" },
                            React.createElement("input", { id: "password", name: "password", type: "password", required: true, value: password, onChange: (e) => setPassword(e.target.value), className: "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500" }))),
                    React.createElement("div", null,
                        React.createElement("label", { htmlFor: "confirmPassword", className: "block text-sm font-medium text-gray-700" }, "Confirm Password"),
                        React.createElement("div", { className: "mt-1" },
                            React.createElement("input", { id: "confirmPassword", name: "confirmPassword", type: "password", required: true, value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), className: "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500" }))),
                    React.createElement("div", null,
                        React.createElement("button", { type: "submit", disabled: loading, className: "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200" }, loading ? 'Creating account...' : 'Create account'))),
                React.createElement("div", { className: "mt-6" },
                    React.createElement("div", { className: "relative" },
                        React.createElement("div", { className: "absolute inset-0 flex items-center" },
                            React.createElement("div", { className: "w-full border-t border-gray-300" })),
                        React.createElement("div", { className: "relative flex justify-center text-sm" },
                            React.createElement("span", { className: "px-2 bg-white text-gray-500" }, "Or continue with"))),
                    React.createElement("div", { className: "mt-6" },
                        React.createElement("button", { onClick: handleGoogleSignIn, className: "w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200" },
                            React.createElement("img", { src: "https://www.google.com/favicon.ico", alt: "Google", className: "w-5 h-5" }),
                            "Sign up with Google"))),
                React.createElement("p", { className: "mt-8 text-center text-sm text-gray-600" },
                    "Already have an account?",
                    ' ',
                    React.createElement(Link, { to: "/login", className: "font-medium text-green-600 hover:text-green-500 transition-colors duration-200" }, "Sign in"))))));
}
