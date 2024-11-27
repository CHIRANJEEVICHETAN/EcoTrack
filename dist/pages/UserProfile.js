var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useEffect, useState } from 'react';
import { UserCircleIcon, PencilIcon, CameraIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
export default function UserProfile() {
    const { currentUser } = useAuth();
    const [userStats, setUserStats] = useState({
        itemsRecycled: 0,
        environmentalImpact: '0',
        recyclingPoints: 0,
        carbonSaved: 0,
        treesEquivalent: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [displayName, setDisplayName] = useState((currentUser === null || currentUser === void 0 ? void 0 : currentUser.displayName) || '');
    const [isEditingName, setIsEditingName] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPhotoOptions, setShowPhotoOptions] = useState(false);
    useEffect(() => {
        const fetchUserData = () => __awaiter(this, void 0, void 0, function* () {
            if (!currentUser)
                return;
            try {
                const wasteQuery = query(collection(db, 'e-waste'), where('userId', '==', currentUser.uid));
                const wasteSnapshot = yield getDocs(wasteQuery);
                const wasteItems = wasteSnapshot.docs.map(doc => {
                    var _a;
                    return (Object.assign(Object.assign({}, doc.data()), { createdAt: (_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate() }));
                });
                // Calculate enhanced stats
                const totalItems = wasteItems.length;
                const totalWeight = wasteItems.reduce((sum, item) => sum + (item.weight || 0), 0);
                const carbonSaved = totalWeight * 2.5; // Approximate CO2 savings per kg
                const treesEquivalent = carbonSaved / 21.7; // Average CO2 absorption per tree per year
                setUserStats({
                    itemsRecycled: totalItems,
                    environmentalImpact: `${(totalWeight * 0.02).toFixed(2)} tons`,
                    recyclingPoints: totalItems * 20,
                    carbonSaved: parseFloat(carbonSaved.toFixed(2)),
                    treesEquivalent: parseFloat(treesEquivalent.toFixed(1))
                });
                // Sort by date and get recent items
                const sortedItems = wasteItems
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                    .slice(0, 5);
                setRecentActivity(sortedItems);
            }
            catch (error) {
                console.error('Error fetching user data:', error);
                setError('Failed to load user data');
            }
            setLoading(false);
        });
        fetchUserData();
    }, [currentUser]);
    const handlePhotoUpload = (e) => __awaiter(this, void 0, void 0, function* () {
        if (!e.target.files || !e.target.files[0])
            return;
        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB');
            return;
        }
        setUploading(true);
        setError('');
        try {
            const storage = getStorage();
            const photoRef = ref(storage, `profile-photos/${currentUser === null || currentUser === void 0 ? void 0 : currentUser.uid}`);
            yield uploadBytes(photoRef, file);
            const photoURL = yield getDownloadURL(photoRef);
            yield updateProfile(currentUser, { photoURL });
            setSuccess('Profile photo updated successfully');
            setTimeout(() => setSuccess(''), 3000);
            setShowPhotoOptions(false);
        }
        catch (error) {
            console.error('Error uploading photo:', error);
            setError('Failed to upload photo');
        }
        setUploading(false);
    });
    const handlePhotoDelete = () => __awaiter(this, void 0, void 0, function* () {
        if (!(currentUser === null || currentUser === void 0 ? void 0 : currentUser.photoURL))
            return;
        try {
            const storage = getStorage();
            const photoRef = ref(storage, `profile-photos/${currentUser.uid}`);
            yield deleteObject(photoRef);
            yield updateProfile(currentUser, { photoURL: null });
            setSuccess('Profile photo removed successfully');
            setTimeout(() => setSuccess(''), 3000);
            setShowPhotoOptions(false);
        }
        catch (error) {
            console.error('Error deleting photo:', error);
            setError('Failed to delete photo');
        }
    });
    const handleNameUpdate = () => __awaiter(this, void 0, void 0, function* () {
        if (!displayName.trim()) {
            setError('Name cannot be empty');
            return;
        }
        try {
            yield updateProfile(currentUser, { displayName: displayName.trim() });
            setIsEditingName(false);
            setSuccess('Name updated successfully');
            setTimeout(() => setSuccess(''), 3000);
        }
        catch (error) {
            console.error('Error updating name:', error);
            setError('Failed to update name');
        }
    });
    if (loading) {
        return React.createElement("div", { className: "text-center mt-8" }, "Loading...");
    }
    return (React.createElement("div", { className: "max-w-7xl mx-auto" },
        error && (React.createElement("div", { className: "mb-4 p-4 bg-red-100 text-red-700 rounded-lg" }, error)),
        success && (React.createElement("div", { className: "mb-4 p-4 bg-green-100 text-green-700 rounded-lg" }, success)),
        React.createElement("div", { className: "bg-white shadow-md rounded-lg" },
            React.createElement("div", { className: "px-4 py-5 sm:px-6" },
                React.createElement("div", { className: "flex items-center" },
                    React.createElement("div", { className: "relative group" },
                        (currentUser === null || currentUser === void 0 ? void 0 : currentUser.photoURL) ? (React.createElement("img", { src: currentUser.photoURL, alt: "Profile", className: "h-24 w-24 rounded-full object-cover", onClick: () => setShowPhotoOptions(!showPhotoOptions) })) : (React.createElement(UserCircleIcon, { className: "h-24 w-24 text-gray-400 cursor-pointer", onClick: () => setShowPhotoOptions(!showPhotoOptions) })),
                        React.createElement("button", { onClick: () => setShowPhotoOptions(!showPhotoOptions), className: "absolute bottom-0 right-0 bg-green-600 rounded-full p-2 text-white hover:bg-green-700" },
                            React.createElement(CameraIcon, { className: "h-4 w-4" })),
                        showPhotoOptions && (React.createElement("div", { className: "absolute mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5" },
                            React.createElement("div", { className: "py-1" },
                                React.createElement("label", { className: "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer" },
                                    "Upload New Photo",
                                    React.createElement("input", { type: "file", className: "hidden", accept: "image/*", onChange: handlePhotoUpload, disabled: uploading })),
                                (currentUser === null || currentUser === void 0 ? void 0 : currentUser.photoURL) && (React.createElement("button", { onClick: handlePhotoDelete, className: "block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-gray-100" }, "Remove Photo")))))),
                    React.createElement("div", { className: "ml-6 flex-1" },
                        React.createElement("div", { className: "flex items-center justify-between" }, isEditingName ? (React.createElement("div", { className: "flex items-center gap-2" },
                            React.createElement("input", { type: "text", value: displayName, onChange: (e) => setDisplayName(e.target.value), className: "rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" }),
                            React.createElement("button", { onClick: handleNameUpdate, className: "text-green-600 hover:text-green-700" }, "Save"),
                            React.createElement("button", { onClick: () => setIsEditingName(false), className: "text-gray-600 hover:text-gray-700" }, "Cancel"))) : (React.createElement("h2", { className: "text-2xl font-bold text-gray-900 flex items-center gap-2" },
                            (currentUser === null || currentUser === void 0 ? void 0 : currentUser.displayName) || (currentUser === null || currentUser === void 0 ? void 0 : currentUser.email),
                            React.createElement("button", { onClick: () => setIsEditingName(true), className: "text-green-600 hover:text-green-700" },
                                React.createElement(PencilIcon, { className: "h-5 w-5" }))))),
                        React.createElement("p", { className: "text-sm text-gray-500" },
                            "Member since",
                            ' ',
                            (currentUser === null || currentUser === void 0 ? void 0 : currentUser.metadata.creationTime)
                                ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                                : 'Recently')))),
            React.createElement("div", { className: "border-t border-gray-200 px-4 py-5 sm:px-6" },
                React.createElement("h3", { className: "text-lg font-medium text-gray-900" }, "Environmental Impact"),
                React.createElement("dl", { className: "mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3" },
                    React.createElement("div", { className: "px-4 py-5 bg-green-50 shadow rounded-lg overflow-hidden sm:p-6" },
                        React.createElement("dt", { className: "text-sm font-medium text-green-600 truncate" }, "Carbon Saved"),
                        React.createElement("dd", { className: "mt-1 text-3xl font-semibold text-green-900" },
                            userStats.carbonSaved,
                            " kg CO\u2082")),
                    React.createElement("div", { className: "px-4 py-5 bg-green-50 shadow rounded-lg overflow-hidden sm:p-6" },
                        React.createElement("dt", { className: "text-sm font-medium text-green-600 truncate" }, "Trees Equivalent"),
                        React.createElement("dd", { className: "mt-1 text-3xl font-semibold text-green-900" },
                            userStats.treesEquivalent,
                            " trees")),
                    React.createElement("div", { className: "px-4 py-5 bg-green-50 shadow rounded-lg overflow-hidden sm:p-6" },
                        React.createElement("dt", { className: "text-sm font-medium text-green-600 truncate" }, "Recycling Points"),
                        React.createElement("dd", { className: "mt-1 text-3xl font-semibold text-green-900" }, userStats.recyclingPoints)))),
            React.createElement("div", { className: "border-t border-gray-200 px-4 py-5 sm:px-6" },
                React.createElement("h3", { className: "text-lg font-medium text-gray-900 mb-4" }, "Recent Activity"),
                React.createElement("div", { className: "flow-root" },
                    React.createElement("ul", { className: "-mb-8" }, recentActivity.map((item, index) => (React.createElement("li", { key: index },
                        React.createElement("div", { className: "relative pb-8" },
                            index !== recentActivity.length - 1 ? (React.createElement("span", { className: "absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200", "aria-hidden": "true" })) : null,
                            React.createElement("div", { className: "relative flex space-x-3" },
                                React.createElement("div", null,
                                    React.createElement("span", { className: `h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${item.status === 'Completed' ? 'bg-green-500' : 'bg-gray-400'}` },
                                        React.createElement(TrashIcon, { className: "h-5 w-5 text-white", "aria-hidden": "true" }))),
                                React.createElement("div", { className: "min-w-0 flex-1 pt-1.5 flex justify-between space-x-4" },
                                    React.createElement("div", null,
                                        React.createElement("p", { className: "text-sm text-gray-500" },
                                            "Recycled ",
                                            React.createElement("span", { className: "font-medium text-gray-900" }, item.itemType),
                                            item.weight && ` (${item.weight} kg)`)),
                                    React.createElement("div", { className: "text-right text-sm whitespace-nowrap text-gray-500" },
                                        React.createElement("time", { dateTime: item.createdAt.toISOString() }, item.createdAt.toLocaleDateString()))))))))))),
            React.createElement("div", { className: "border-t border-gray-200 px-4 py-5 sm:px-6" },
                React.createElement("h3", { className: "text-lg font-medium text-gray-900 mb-4" }, "Achievements"),
                React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4" },
                    userStats.itemsRecycled >= 5 && (React.createElement("div", { className: "text-center transform hover:scale-105 transition-transform" },
                        React.createElement("div", { className: "bg-green-100 p-4 rounded-full inline-block" },
                            React.createElement("span", { className: "text-2xl" }, "\uD83C\uDF31")),
                        React.createElement("p", { className: "mt-2 text-sm font-medium" }, "Eco Starter"),
                        React.createElement("p", { className: "text-xs text-gray-500" }, "Recycled 5+ items"))),
                    userStats.itemsRecycled >= 10 && (React.createElement("div", { className: "text-center transform hover:scale-105 transition-transform" },
                        React.createElement("div", { className: "bg-green-100 p-4 rounded-full inline-block" },
                            React.createElement("span", { className: "text-2xl" }, "\uD83C\uDF3F")),
                        React.createElement("p", { className: "mt-2 text-sm font-medium" }, "Green Warrior"),
                        React.createElement("p", { className: "text-xs text-gray-500" }, "Recycled 10+ items"))),
                    userStats.carbonSaved >= 100 && (React.createElement("div", { className: "text-center transform hover:scale-105 transition-transform" },
                        React.createElement("div", { className: "bg-green-100 p-4 rounded-full\r\ninline-block" },
                            React.createElement("span", { className: "text-2xl" }, "\uD83C\uDF0D")),
                        React.createElement("p", { className: "mt-2 text-sm font-medium" }, "Earth Protector"),
                        React.createElement("p", { className: "text-xs text-gray-500" }, "Saved 100+ kg CO\u2082"))),
                    userStats.treesEquivalent >= 5 && (React.createElement("div", { className: "text-center transform hover:scale-105 transition-transform" },
                        React.createElement("div", { className: "bg-green-100 p-4 rounded-full inline-block" },
                            React.createElement("span", { className: "text-2xl" }, "\uD83C\uDF33")),
                        React.createElement("p", { className: "mt-2 text-sm font-medium" }, "Forest Guardian"),
                        React.createElement("p", { className: "text-xs text-gray-500" }, "Equivalent to 5+ trees"))))),
            React.createElement("div", { className: "border-t border-gray-200 px-4 py-5 sm:px-6" },
                React.createElement("h3", { className: "text-lg font-medium text-gray-900 mb-4" }, "Recycling Goals"),
                React.createElement("div", { className: "space-y-4" },
                    React.createElement("div", null,
                        React.createElement("div", { className: "flex justify-between text-sm font-medium" },
                            React.createElement("span", null, "Monthly Recycling Goal"),
                            React.createElement("span", null,
                                Math.min(userStats.itemsRecycled, 10),
                                "/10 items")),
                        React.createElement("div", { className: "mt-2 relative" },
                            React.createElement("div", { className: "overflow-hidden h-2 text-xs flex rounded bg-green-100" },
                                React.createElement("div", { style: { width: `${Math.min((userStats.itemsRecycled / 10) * 100, 100)}%` }, className: "shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500" })))),
                    React.createElement("div", null,
                        React.createElement("div", { className: "flex justify-between text-sm font-medium" },
                            React.createElement("span", null, "Carbon Saving Goal"),
                            React.createElement("span", null,
                                Math.min(userStats.carbonSaved, 200),
                                "/200 kg CO\u2082")),
                        React.createElement("div", { className: "mt-2 relative" },
                            React.createElement("div", { className: "overflow-hidden h-2 text-xs flex rounded bg-green-100" },
                                React.createElement("div", { style: { width: `${Math.min((userStats.carbonSaved / 200) * 100, 100)}%` }, className: "shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500" })))))))));
}
