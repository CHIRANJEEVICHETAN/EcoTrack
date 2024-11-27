var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, getDocs, updateDoc, doc, deleteDoc, where, addDoc } from 'firebase/firestore';
import { ChartBarIcon, UsersIcon, TrashIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
export default function AdminDashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [wasteItems, setWasteItems] = useState([]);
    const [users, setUsers] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalItems: 0,
        completedItems: 0,
        pendingItems: 0,
    });
    // New vendor form state
    const [newVendor, setNewVendor] = useState({
        name: '',
        location: '',
        contact: '',
        materials: [],
        newMaterial: '', // For the material input field
    });
    useEffect(() => {
        if ((currentUser === null || currentUser === void 0 ? void 0 : currentUser.email) !== 'admin@ecotrack.com') {
            navigate('/');
            return;
        }
        const fetchData = () => __awaiter(this, void 0, void 0, function* () {
            try {
                // Fetch waste items
                const wasteQuery = query(collection(db, 'e-waste'));
                const wasteSnapshot = yield getDocs(wasteQuery);
                const wasteData = wasteSnapshot.docs.map(doc => {
                    var _a;
                    return (Object.assign(Object.assign({ id: doc.id }, doc.data()), { createdAt: (_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate() }));
                });
                setWasteItems(wasteData);
                // Fetch users from Firestore
                const usersQuery = query(collection(db, 'users'));
                const usersSnapshot = yield getDocs(usersQuery);
                const usersData = yield Promise.all(usersSnapshot.docs.map((doc) => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    const userWasteQuery = query(collection(db, 'e-waste'), where('userId', '==', doc.id));
                    const userWasteSnapshot = yield getDocs(userWasteQuery);
                    return {
                        uid: doc.id,
                        email: doc.data().email || '',
                        displayName: doc.data().displayName || null,
                        itemsRecycled: userWasteSnapshot.docs.length,
                        joinDate: ((_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate()) || new Date(),
                    };
                })));
                setUsers(usersData);
                // Fetch vendors
                const vendorsQuery = query(collection(db, 'vendors'));
                const vendorsSnapshot = yield getDocs(vendorsQuery);
                const vendorsData = vendorsSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                setVendors(vendorsData);
                // Calculate statistics
                setStats({
                    totalUsers: usersData.length,
                    totalItems: wasteData.length,
                    completedItems: wasteData.filter(item => item.status === 'Completed').length,
                    pendingItems: wasteData.filter(item => item.status === 'Pending').length,
                });
            }
            catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to load dashboard data');
            }
            setLoading(false);
        });
        fetchData();
    }, [currentUser, navigate]);
    const addVendor = () => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!newVendor.name || !newVendor.location || !newVendor.contact) {
                setError('Please fill in all required fields');
                return;
            }
            const vendorData = {
                name: newVendor.name,
                location: newVendor.location,
                contact: newVendor.contact,
                materials: newVendor.materials,
            };
            const docRef = yield addDoc(collection(db, 'vendors'), vendorData);
            setVendors([...vendors, Object.assign(Object.assign({}, vendorData), { id: docRef.id })]);
            // Reset form
            setNewVendor({
                name: '',
                location: '',
                contact: '',
                materials: [],
                newMaterial: '',
            });
        }
        catch (error) {
            console.error('Error adding vendor:', error);
            setError('Failed to add vendor');
        }
    });
    const deleteVendor = (id) => __awaiter(this, void 0, void 0, function* () {
        try {
            yield deleteDoc(doc(db, 'vendors', id));
            setVendors(vendors.filter(vendor => vendor.id !== id));
        }
        catch (error) {
            console.error('Error deleting vendor:', error);
            setError('Failed to delete vendor');
        }
    });
    const addMaterial = () => {
        if (newVendor.newMaterial.trim()) {
            setNewVendor(Object.assign(Object.assign({}, newVendor), { materials: [...newVendor.materials, newVendor.newMaterial.trim()], newMaterial: '' }));
        }
    };
    const removeMaterial = (index) => {
        setNewVendor(Object.assign(Object.assign({}, newVendor), { materials: newVendor.materials.filter((_, i) => i !== index) }));
    };
    const updateWasteStatus = (id, status) => __awaiter(this, void 0, void 0, function* () {
        try {
            yield updateDoc(doc(db, 'e-waste', id), { status });
            setWasteItems(prev => prev.map(item => item.id === id ? Object.assign(Object.assign({}, item), { status }) : item));
        }
        catch (error) {
            console.error('Error updating status:', error);
            setError('Failed to update status');
        }
    });
    const deleteWasteItem = (id) => __awaiter(this, void 0, void 0, function* () {
        try {
            yield deleteDoc(doc(db, 'e-waste', id));
            setWasteItems(prev => prev.filter(item => item.id !== id));
        }
        catch (error) {
            console.error('Error deleting waste item:', error);
            setError('Failed to delete item');
        }
    });
    const deleteUserData = (uid) => __awaiter(this, void 0, void 0, function* () {
        try {
            // Delete user's waste items
            const userWasteQuery = query(collection(db, 'e-waste'), where('userId', '==', uid));
            const userWasteSnapshot = yield getDocs(userWasteQuery);
            yield Promise.all(userWasteSnapshot.docs.map(doc => deleteDoc(doc.ref)));
            // Delete user document from Firestore
            yield deleteDoc(doc(db, 'users', uid));
            // Update local state
            setUsers(prev => prev.filter(user => user.uid !== uid));
            setError('User data deleted successfully');
        }
        catch (error) {
            console.error('Error deleting user data:', error);
            setError('Failed to delete user data');
        }
    });
    if (loading) {
        return (React.createElement("div", { className: "flex items-center justify-center min-h-screen" },
            React.createElement("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" })));
    }
    return (React.createElement("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" },
        React.createElement("div", { className: "flex justify-between items-center mb-8" },
            React.createElement("h2", { className: "text-3xl font-bold text-gray-900" }, "Admin Dashboard"),
            React.createElement("div", { className: "flex space-x-4" },
                React.createElement("button", { onClick: () => setActiveTab('overview'), className: `px-4 py-2 rounded-lg ${activeTab === 'overview'
                        ? 'bg-green-600 text-white'
                        : 'text-gray-600 hover:bg-green-50'}` },
                    React.createElement(ChartBarIcon, { className: "h-5 w-5 inline-block mr-2" }),
                    "Overview"),
                React.createElement("button", { onClick: () => setActiveTab('users'), className: `px-4 py-2 rounded-lg ${activeTab === 'users'
                        ? 'bg-green-600 text-white'
                        : 'text-gray-600 hover:bg-green-50'}` },
                    React.createElement(UsersIcon, { className: "h-5 w-5 inline-block mr-2" }),
                    "Users"),
                React.createElement("button", { onClick: () => setActiveTab('vendors'), className: `px-4 py-2 rounded-lg ${activeTab === 'vendors'
                        ? 'bg-green-600 text-white'
                        : 'text-gray-600 hover:bg-green-50'}` },
                    React.createElement(BuildingStorefrontIcon, { className: "h-5 w-5 inline-block mr-2" }),
                    "Vendors"),
                React.createElement("button", { onClick: () => setActiveTab('waste'), className: `px-4 py-2 rounded-lg ${activeTab === 'waste'
                        ? 'bg-green-600 text-white'
                        : 'text-gray-600 hover:bg-green-50'}` },
                    React.createElement(TrashIcon, { className: "h-5 w-5 inline-block mr-2" }),
                    "E-Waste"))),
        error && (React.createElement("div", { className: "mb-4 bg-red-50 border border-red-200 text-red-600 rounded-md p-4" }, error)),
        activeTab === 'overview' && (React.createElement("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" },
            React.createElement("div", { className: "bg-white overflow-hidden shadow rounded-lg" },
                React.createElement("div", { className: "p-5" },
                    React.createElement("div", { className: "flex items-center" },
                        React.createElement("div", { className: "flex-shrink-0" },
                            React.createElement(UsersIcon, { className: "h-6 w-6 text-gray-400" })),
                        React.createElement("div", { className: "ml-5 w-0 flex-1" },
                            React.createElement("dl", null,
                                React.createElement("dt", { className: "text-sm font-medium text-gray-500 truncate" }, "Total Users"),
                                React.createElement("dd", { className: "text-3xl font-semibold text-gray-900" }, stats.totalUsers)))))),
            React.createElement("div", { className: "bg-white overflow-hidden shadow rounded-lg" },
                React.createElement("div", { className: "p-5" },
                    React.createElement("div", { className: "flex items-center" },
                        React.createElement("div", { className: "flex-shrink-0" },
                            React.createElement(TrashIcon, { className: "h-6 w-6 text-gray-400" })),
                        React.createElement("div", { className: "ml-5 w-0 flex-1" },
                            React.createElement("dl", null,
                                React.createElement("dt", { className: "text-sm font-medium text-gray-500 truncate" }, "Total Items"),
                                React.createElement("dd", { className: "text-3xl font-semibold text-gray-900" }, stats.totalItems)))))),
            React.createElement("div", { className: "bg-white overflow-hidden shadow rounded-lg" },
                React.createElement("div", { className: "p-5" },
                    React.createElement("div", { className: "flex items-center" },
                        React.createElement("div", { className: "flex-shrink-0" },
                            React.createElement(ChartBarIcon, { className: "h-6 w-6 text-gray-400" })),
                        React.createElement("div", { className: "ml-5 w-0 flex-1" },
                            React.createElement("dl", null,
                                React.createElement("dt", { className: "text-sm font-medium text-gray-500 truncate" }, "Completed Items"),
                                React.createElement("dd", { className: "text-3xl font-semibold text-gray-900" }, stats.completedItems)))))),
            React.createElement("div", { className: "bg-white overflow-hidden shadow rounded-lg" },
                React.createElement("div", { className: "p-5" },
                    React.createElement("div", { className: "flex items-center" },
                        React.createElement("div", { className: "flex-shrink-0" },
                            React.createElement(BuildingStorefrontIcon, { className: "h-6 w-6 text-gray-400" })),
                        React.createElement("div", { className: "ml-5 w-0 flex-1" },
                            React.createElement("dl", null,
                                React.createElement("dt", { className: "text-sm font-medium text-gray-500 truncate" }, "Active Vendors"),
                                React.createElement("dd", { className: "text-3xl font-semibold text-gray-900" }, vendors.length)))))))),
        activeTab === 'vendors' && (React.createElement("div", { className: "space-y-6" },
            React.createElement("div", { className: "bg-white shadow-md rounded-lg p-6" },
                React.createElement("h3", { className: "text-lg font-medium text-gray-900 mb-4" }, "Add New Vendor"),
                React.createElement("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2" },
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-medium text-gray-700" }, "Name"),
                        React.createElement("input", { type: "text", value: newVendor.name, onChange: (e) => setNewVendor(Object.assign(Object.assign({}, newVendor), { name: e.target.value })), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" })),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-medium text-gray-700" }, "Location"),
                        React.createElement("input", { type: "text", value: newVendor.location, onChange: (e) => setNewVendor(Object.assign(Object.assign({}, newVendor), { location: e.target.value })), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" })),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-medium text-gray-700" }, "Contact"),
                        React.createElement("input", { type: "email", value: newVendor.contact, onChange: (e) => setNewVendor(Object.assign(Object.assign({}, newVendor), { contact: e.target.value })), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" })),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-medium text-gray-700" }, "Materials"),
                        React.createElement("div", { className: "flex gap-2" },
                            React.createElement("input", { type: "text", value: newVendor.newMaterial, onChange: (e) => setNewVendor(Object.assign(Object.assign({}, newVendor), { newMaterial: e.target.value })), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500", placeholder: "Add material..." }),
                            React.createElement("button", { onClick: addMaterial, className: "mt-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700" }, "Add")),
                        React.createElement("div", { className: "mt-2 flex flex-wrap gap-2" }, newVendor.materials.map((material, index) => (React.createElement("span", { key: index, className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800" },
                            material,
                            React.createElement("button", { onClick: () => removeMaterial(index), className: "ml-1 text-green-600 hover:text-green-800" }, "\u00D7"))))))),
                React.createElement("button", { onClick: addVendor, className: "mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700" }, "Add Vendor")),
            React.createElement("div", { className: "bg-white shadow-md rounded-lg overflow-hidden" },
                React.createElement("table", { className: "min-w-full divide-y divide-gray-200" },
                    React.createElement("thead", { className: "bg-gray-50" },
                        React.createElement("tr", null,
                            React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Vendor"),
                            React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Location"),
                            React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Materials"),
                            React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Contact"),
                            React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Actions"))),
                    React.createElement("tbody", { className: "bg-white divide-y divide-gray-200" }, vendors.map((vendor) => (React.createElement("tr", { key: vendor.id },
                        React.createElement("td", { className: "px-6 py-4 whitespace-nowrap" },
                            React.createElement("div", { className: "text-sm font-medium text-gray-900" }, vendor.name)),
                        React.createElement("td", { className: "px-6 py-4 whitespace-nowrap" },
                            React.createElement("div", { className: "text-sm text-gray-500" }, vendor.location)),
                        React.createElement("td", { className: "px-6 py-4" },
                            React.createElement("div", { className: "flex flex-wrap gap-2" }, vendor.materials.map((material, index) => (React.createElement("span", { key: index, className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800" }, material))))),
                        React.createElement("td", { className: "px-6 py-4 whitespace-nowrap" },
                            React.createElement("div", { className: "text-sm text-gray-500" }, vendor.contact)),
                        React.createElement("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium" },
                            React.createElement("button", { onClick: () => deleteVendor(vendor.id), className: "text-red-600 hover:text-red-900" }, "Delete")))))))))),
        activeTab === 'users' && (React.createElement("div", { className: "bg-white shadow overflow-hidden sm:rounded-lg" },
            React.createElement("table", { className: "min-w-full divide-y divide-gray-200" },
                React.createElement("thead", { className: "bg-gray-50" },
                    React.createElement("tr", null,
                        React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "User"),
                        React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Items Recycled"),
                        React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Join Date"),
                        React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Actions"))),
                React.createElement("tbody", { className: "bg-white divide-y divide-gray-200" }, users.map((user) => (React.createElement("tr", { key: user.uid },
                    React.createElement("td", { className: "px-6 py-4 whitespace-nowrap" },
                        React.createElement("div", { className: "text-sm font-medium text-gray-900" }, user.displayName || 'N/A'),
                        React.createElement("div", { className: "text-sm text-gray-500" }, user.email)),
                    React.createElement("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500" }, user.itemsRecycled),
                    React.createElement("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500" }, user.joinDate.toLocaleDateString()),
                    React.createElement("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium" },
                        React.createElement("button", { onClick: () => deleteUserData(user.uid), className: "text-red-600 hover:text-red-900" }, "Delete"))))))))),
        activeTab === 'waste' && (React.createElement("div", { className: "bg-white shadow overflow-hidden sm:rounded-lg" },
            React.createElement("table", { className: "min-w-full divide-y divide-gray-200" },
                React.createElement("thead", { className: "bg-gray-50" },
                    React.createElement("tr", null,
                        React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Item"),
                        React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "User"),
                        React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Location"),
                        React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Status"),
                        React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Actions"))),
                React.createElement("tbody", { className: "bg-white divide-y divide-gray-200" }, wasteItems.map((item) => (React.createElement("tr", { key: item.id },
                    React.createElement("td", { className: "px-6 py-4 whitespace-nowrap" },
                        React.createElement("div", { className: "text-sm font-medium text-gray-900" }, item.itemType),
                        React.createElement("div", { className: "text-sm text-gray-500" },
                            item.brand,
                            " ",
                            item.model)),
                    React.createElement("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500" }, item.userEmail),
                    React.createElement("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500" }, item.location),
                    React.createElement("td", { className: "px-6 py-4 whitespace-nowrap" },
                        React.createElement("select", { value: item.status, onChange: (e) => updateWasteStatus(item.id, e.target.value), className: "rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" },
                            React.createElement("option", { value: "Pending" }, "Pending"),
                            React.createElement("option", { value: "In Progress" }, "In Progress"),
                            React.createElement("option", { value: "Completed" }, "Completed"))),
                    React.createElement("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium" },
                        React.createElement("button", { onClick: () => deleteWasteItem(item.id), className: "text-red-600 hover:text-red-900" }, "Delete")))))))))));
}
