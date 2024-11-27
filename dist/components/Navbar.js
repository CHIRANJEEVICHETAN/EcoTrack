var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Disclosure, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
export default function Navbar() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const handleLogout = () => __awaiter(this, void 0, void 0, function* () {
        try {
            yield logout();
            navigate('/');
        }
        catch (error) {
            console.error('Logout error:', error);
        }
    });
    const isAdmin = (currentUser === null || currentUser === void 0 ? void 0 : currentUser.email) === 'admin@ecotrack.com';
    const navigation = [
        { name: 'Home', href: '/', public: true },
        { name: 'Track E-Waste', href: '/track', public: false },
        { name: 'Track Submission', href: '/track-submission', public: false },
        { name: 'Vendors', href: '/vendors', public: true },
        { name: 'Reports', href: '/reports', public: false },
        { name: 'Profile', href: '/profile', public: false },
        { name: 'Admin Dashboard', href: '/admin', public: false, adminOnly: true },
    ];
    const isActive = (path) => location.pathname === path;
    const filteredNavigation = navigation.filter(item => {
        if (item.adminOnly && !isAdmin)
            return false;
        return item.public || currentUser;
    });
    const authLinks = currentUser ? (React.createElement("button", { onClick: handleLogout, className: "text-green-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium\r\n                transition-colors duration-200 hover:bg-green-700" }, "Logout")) : (React.createElement("div", { className: "flex items-center space-x-4" },
        React.createElement(Link, { to: "/login", className: "text-green-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium\r\n                   transition-colors duration-200 hover:bg-green-700" }, "Login"),
        React.createElement(Link, { to: "/signup", className: "bg-white text-green-600 hover:bg-green-50 px-3 py-2 rounded-md text-sm font-medium\r\n                   transition-colors duration-200" }, "Sign Up")));
    return (React.createElement(Disclosure, { as: "nav", className: "bg-green-600 shadow-lg" }, ({ open }) => (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" },
            React.createElement("div", { className: "flex h-16 items-center justify-between" },
                React.createElement("div", { className: "flex items-center" },
                    React.createElement("div", { className: "flex-shrink-0" },
                        React.createElement(Link, { to: "/", className: "text-white text-xl font-bold hover:text-green-100 transition-colors duration-200" }, "EcoTrack")),
                    React.createElement("div", { className: "hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4" }, filteredNavigation.map((item) => (React.createElement(Link, { key: item.name, to: item.href, className: `${isActive(item.href)
                            ? 'bg-green-700 text-white'
                            : 'text-green-100 hover:text-white hover:bg-green-700'} px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200` }, item.name))))),
                React.createElement("div", { className: "hidden sm:flex sm:items-center sm:space-x-6" }, authLinks),
                React.createElement("div", { className: "flex items-center sm:hidden" },
                    React.createElement(Disclosure.Button, { className: "inline-flex items-center justify-center rounded-md p-2 text-green-100 \r\n                                            hover:bg-green-700 hover:text-white focus:outline-none focus:ring-2 \r\n                                            focus:ring-inset focus:ring-white transition-colors duration-200" },
                        React.createElement("span", { className: "sr-only" }, "Open main menu"),
                        open ? (React.createElement(XMarkIcon, { className: "block h-6 w-6", "aria-hidden": "true" })) : (React.createElement(Bars3Icon, { className: "block h-6 w-6", "aria-hidden": "true" })))))),
        React.createElement(Transition, { enter: "transition duration-100 ease-out", enterFrom: "transform scale-95 opacity-0", enterTo: "transform scale-100 opacity-100", leave: "transition duration-75 ease-out", leaveFrom: "transform scale-100 opacity-100", leaveTo: "transform scale-95 opacity-0" },
            React.createElement(Disclosure.Panel, { className: "sm:hidden" },
                React.createElement("div", { className: "space-y-1 px-2 pb-3 pt-2" },
                    filteredNavigation.map((item) => (React.createElement(Disclosure.Button, { key: item.name, as: Link, to: item.href, className: `${isActive(item.href)
                            ? 'bg-green-700 text-white'
                            : 'text-green-100 hover:text-white hover:bg-green-700'} block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200` }, item.name))),
                    React.createElement("div", { className: "mt-4 border-t border-green-700 pt-4" }, authLinks))))))));
}
