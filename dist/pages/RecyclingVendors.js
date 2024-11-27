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
import { collection, query, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
export default function RecyclingVendors() {
    var _a;
    const { currentUser } = useAuth();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProcessingForm, setShowProcessingForm] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState('');
    const [processingData, setProcessingData] = useState({
        materialType: '',
        quantity: 0,
        purityRate: 0,
        electricity: 0,
        water: 0,
        labor: 0,
    });
    useEffect(() => {
        const fetchVendors = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const vendorsQuery = query(collection(db, 'vendors'));
                const snapshot = yield getDocs(vendorsQuery);
                const vendorsList = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                setVendors(vendorsList);
            }
            catch (error) {
                console.error('Error fetching vendors:', error);
            }
            setLoading(false);
        });
        fetchVendors();
    }, []);
    const handleProcessingSubmit = (e) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        e.preventDefault();
        if (!selectedVendor)
            return;
        try {
            // Add processing record
            yield addDoc(collection(db, 'recycleData'), Object.assign(Object.assign({ vendorId: selectedVendor }, processingData), { timestamp: new Date() }));
            // Update vendor's purity rates and resource usage
            const vendorRef = doc(db, 'vendors', selectedVendor);
            const vendor = vendors.find(v => v.id === selectedVendor);
            if (vendor) {
                const updatedPurityRates = Object.assign(Object.assign({}, vendor.purityRates), { [processingData.materialType]: processingData.purityRate });
                const updatedResourceUsage = {
                    electricity: (((_a = vendor.resourceUsage) === null || _a === void 0 ? void 0 : _a.electricity) || 0) + processingData.electricity,
                    water: (((_b = vendor.resourceUsage) === null || _b === void 0 ? void 0 : _b.water) || 0) + processingData.water,
                    labor: (((_c = vendor.resourceUsage) === null || _c === void 0 ? void 0 : _c.labor) || 0) + processingData.labor,
                };
                yield updateDoc(vendorRef, {
                    purityRates: updatedPurityRates,
                    resourceUsage: updatedResourceUsage,
                });
                // Update local state
                setVendors(vendors.map(v => v.id === selectedVendor
                    ? Object.assign(Object.assign({}, v), { purityRates: updatedPurityRates, resourceUsage: updatedResourceUsage }) : v));
            }
            // Reset form
            setProcessingData({
                materialType: '',
                quantity: 0,
                purityRate: 0,
                electricity: 0,
                water: 0,
                labor: 0,
            });
            setShowProcessingForm(false);
        }
        catch (error) {
            console.error('Error submitting processing data:', error);
        }
    });
    if (loading) {
        return React.createElement("div", { className: "text-center mt-8" }, "Loading...");
    }
    return (React.createElement("div", { className: "max-w-7xl mx-auto" },
        React.createElement("div", { className: "flex justify-between items-center mb-8" },
            React.createElement("h2", { className: "text-3xl font-bold text-gray-900" }, "Recycling Vendors"),
            ((_a = currentUser === null || currentUser === void 0 ? void 0 : currentUser.email) === null || _a === void 0 ? void 0 : _a.endsWith('@vendor.ecotrack.com')) && (React.createElement("button", { onClick: () => setShowProcessingForm(true), className: "bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700" }, "Submit Processing Data"))),
        showProcessingForm && (React.createElement("div", { className: "fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center" },
            React.createElement("div", { className: "bg-white rounded-lg p-8 max-w-md w-full" },
                React.createElement("h3", { className: "text-xl font-semibold mb-4" }, "Submit Processing Data"),
                React.createElement("form", { onSubmit: handleProcessingSubmit, className: "space-y-4" },
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-medium text-gray-700" }, "Vendor"),
                        React.createElement("select", { value: selectedVendor, onChange: (e) => setSelectedVendor(e.target.value), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500", required: true },
                            React.createElement("option", { value: "" }, "Select Vendor"),
                            vendors.map(vendor => (React.createElement("option", { key: vendor.id, value: vendor.id }, vendor.name))))),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-medium text-gray-700" }, "Material Type"),
                        React.createElement("input", { type: "text", value: processingData.materialType, onChange: (e) => setProcessingData(Object.assign(Object.assign({}, processingData), { materialType: e.target.value })), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500", required: true })),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-medium text-gray-700" }, "Quantity (kg)"),
                        React.createElement("input", { type: "number", value: processingData.quantity, onChange: (e) => setProcessingData(Object.assign(Object.assign({}, processingData), { quantity: parseFloat(e.target.value) })), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500", required: true })),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-medium text-gray-700" }, "Purity Rate (%)"),
                        React.createElement("input", { type: "number", min: "0", max: "100", value: processingData.purityRate, onChange: (e) => setProcessingData(Object.assign(Object.assign({}, processingData), { purityRate: parseFloat(e.target.value) })), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500", required: true })),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-medium text-gray-700" }, "Electricity Used (kWh)"),
                        React.createElement("input", { type: "number", value: processingData.electricity, onChange: (e) => setProcessingData(Object.assign(Object.assign({}, processingData), { electricity: parseFloat(e.target.value) })), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500", required: true })),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-medium text-gray-700" }, "Water Used (liters)"),
                        React.createElement("input", { type: "number", value: processingData.water, onChange: (e) => setProcessingData(Object.assign(Object.assign({}, processingData), { water: parseFloat(e.target.value) })), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500", required: true })),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-medium text-gray-700" }, "Labor Hours"),
                        React.createElement("input", { type: "number", value: processingData.labor, onChange: (e) => setProcessingData(Object.assign(Object.assign({}, processingData), { labor: parseFloat(e.target.value) })), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500", required: true })),
                    React.createElement("div", { className: "flex justify-end space-x-4" },
                        React.createElement("button", { type: "button", onClick: () => setShowProcessingForm(false), className: "px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500" }, "Cancel"),
                        React.createElement("button", { type: "submit", className: "px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700" }, "Submit")))))),
        React.createElement("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" }, vendors.map((vendor) => (React.createElement("div", { key: vendor.id, className: "bg-white rounded-lg shadow-md p-6" },
            React.createElement("h3", { className: "text-xl font-semibold text-gray-900 mb-2" }, vendor.name),
            React.createElement("p", { className: "text-gray-600 mb-4" }, vendor.location),
            React.createElement("div", { className: "mb-4" },
                React.createElement("h4", { className: "text-sm font-medium text-gray-700 mb-2" }, "Accepted Materials:"),
                React.createElement("div", { className: "flex flex-wrap gap-2" }, vendor.materials.map((material, index) => (React.createElement("span", { key: index, className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800" }, material))))),
            vendor.purityRates && (React.createElement("div", { className: "mb-4" },
                React.createElement("h4", { className: "text-sm font-medium text-gray-700 mb-2" }, "Material Purity Rates:"),
                React.createElement("div", { className: "space-y-2" }, Object.entries(vendor.purityRates).map(([material, rate]) => (React.createElement("div", { key: material, className: "flex justify-between text-sm" },
                    React.createElement("span", { className: "text-gray-600" },
                        material,
                        ":"),
                    React.createElement("span", { className: "font-medium" },
                        rate,
                        "%"))))))),
            vendor.resourceUsage && (React.createElement("div", { className: "mb-4" },
                React.createElement("h4", { className: "text-sm font-medium text-gray-700 mb-2" }, "Resource Usage:"),
                React.createElement("div", { className: "space-y-2 text-sm" },
                    React.createElement("div", { className: "flex justify-between" },
                        React.createElement("span", { className: "text-gray-600" }, "Electricity:"),
                        React.createElement("span", { className: "font-medium" },
                            vendor.resourceUsage.electricity,
                            " kWh")),
                    React.createElement("div", { className: "flex justify-between" },
                        React.createElement("span", { className: "text-gray-600" }, "Water:"),
                        React.createElement("span", { className: "font-medium" },
                            vendor.resourceUsage.water,
                            " L")),
                    React.createElement("div", { className: "flex justify-between" },
                        React.createElement("span", { className: "text-gray-600" }, "Labor:"),
                        React.createElement("span", { className: "font-medium" },
                            vendor.resourceUsage.labor,
                            " hrs"))))),
            React.createElement("a", { href: `mailto:${vendor.contact}`, className: "text-green-600 hover:text-green-800 text-sm font-medium" }, "Contact Vendor")))))));
}
