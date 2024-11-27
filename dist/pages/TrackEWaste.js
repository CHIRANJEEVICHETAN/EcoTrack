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
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getRecyclingRecommendations } from '../services/aiService';
import { blockchainService } from '../services/blockchainService';
import AIRecommendations from "../components/AIRecommendation";
import ImageAnalyzer from '../components/ImageAnalyzer';
import BlockchainVerification from '../components/BlockchainVerification';
import { Link } from 'react-router-dom';
const initialFormData = {
    itemType: 'Computer/Laptop',
    brand: '',
    model: '',
    weight: '',
    condition: 'Working',
    location: '',
    description: '',
    imageAnalysis: '',
    imageUrl: ''
};
export default function TrackEWaste() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [aiRecommendations, setAiRecommendations] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [submittedItemId, setSubmittedItemId] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const handleImageAnalysis = (analysis, imageUrl) => {
        setFormData(prev => (Object.assign(Object.assign({}, prev), { imageAnalysis: analysis, imageUrl: imageUrl, description: prev.description ? `${prev.description}\n\nImage Analysis:\n${analysis}` : analysis })));
        setSelectedImage(imageUrl);
    };
    useEffect(() => {
        const getAIRecommendations = () => __awaiter(this, void 0, void 0, function* () {
            if (formData.itemType && formData.condition) {
                setAiLoading(true);
                try {
                    const recommendations = yield getRecyclingRecommendations(formData.itemType, formData.condition, formData.description);
                    setAiRecommendations(recommendations);
                }
                catch (error) {
                    console.error('Error getting AI recommendations:', error);
                }
                setAiLoading(false);
            }
        });
        getAIRecommendations();
    }, [formData.itemType, formData.condition, formData.description]);
    const handleSubmit = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        setLoading(true);
        try {
            // Add to Firestore
            const docRef = yield addDoc(collection(db, 'e-waste'), Object.assign(Object.assign({}, formData), { userId: currentUser === null || currentUser === void 0 ? void 0 : currentUser.uid, userEmail: currentUser === null || currentUser === void 0 ? void 0 : currentUser.email, status: 'Pending', createdAt: serverTimestamp(), imageUrl: formData.imageUrl || null }));
            // Try blockchain recording separately
            try {
                yield blockchainService.recordWasteItem({
                    id: docRef.id,
                    itemType: formData.itemType,
                    weight: parseFloat(formData.weight),
                    timestamp: Date.now(),
                    userId: (currentUser === null || currentUser === void 0 ? void 0 : currentUser.uid) || ''
                });
            }
            catch (blockchainError) {
                console.error('Blockchain recording failed:', blockchainError);
            }
            setSubmittedItemId(docRef.id);
            setSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => {
                setFormData(initialFormData);
                setSelectedImage(null);
                setSuccess(false);
            }, 5000);
        }
        catch (error) {
            console.error('Error submitting to Firestore:', error);
            alert('Error saving your submission. Please try again.');
        }
        setLoading(false);
    });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => (Object.assign(Object.assign({}, prev), { [name]: value })));
    };
    return (React.createElement("div", { className: "max-w-3xl mx-auto" },
        React.createElement("h2", { className: "text-3xl font-bold text-gray-900 mb-8" }, "Track E-Waste"),
        success && (React.createElement("div", { className: "mb-6 p-4 bg-green-100 text-green-700 rounded-lg flex items-center justify-between sticky top-0 z-50" },
            React.createElement("div", null,
                React.createElement("span", { className: "text-lg font-medium" }, "E-waste item submitted successfully!"),
                React.createElement("div", { className: "mt-2" },
                    React.createElement(Link, { to: `/track-submission/${submittedItemId}`, className: "text-green-600 hover:text-green-800 underline" }, "Track your submission"))),
            React.createElement("svg", { className: "h-6 w-6 text-green-500", fill: "none", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", viewBox: "0 0 24 24", stroke: "currentColor" },
                React.createElement("path", { d: "M5 13l4 4L19 7" })))),
        React.createElement("div", { className: "bg-white shadow-sm rounded-lg p-6" },
            React.createElement(ImageAnalyzer, { onAnalysisComplete: handleImageAnalysis }),
            selectedImage && (React.createElement("div", { className: "mt-4" },
                React.createElement("h4", { className: "text-sm font-medium text-gray-700 mb-2" }, "Uploaded Image:"),
                React.createElement("div", { className: "relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden" },
                    React.createElement("img", { src: selectedImage, alt: "Uploaded e-waste", className: "w-full h-full object-contain" })))),
            formData.imageAnalysis && (React.createElement("div", { className: "mt-4 p-4 bg-blue-50 rounded-lg" },
                React.createElement("h3", { className: "text-lg font-semibold text-blue-800 mb-2" }, "Image Analysis Results"),
                React.createElement("p", { className: "text-blue-600 whitespace-pre-line" }, formData.imageAnalysis))),
            React.createElement("form", { onSubmit: handleSubmit, className: "space-y-6 mt-6" },
                React.createElement("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2" },
                    React.createElement("div", null,
                        React.createElement("label", { htmlFor: "itemType", className: "block text-sm font-medium text-gray-700" }, "Item Type *"),
                        React.createElement("select", { id: "itemType", name: "itemType", value: formData.itemType, onChange: handleChange, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500", required: true },
                            React.createElement("option", null, "Computer/Laptop"),
                            React.createElement("option", null, "Mobile Phone"),
                            React.createElement("option", null, "Tablet"),
                            React.createElement("option", null, "Printer"),
                            React.createElement("option", null, "Monitor"),
                            React.createElement("option", null, "Television"),
                            React.createElement("option", null, "Gaming Console"),
                            React.createElement("option", null, "Other Electronics"))),
                    React.createElement("div", null,
                        React.createElement("label", { htmlFor: "condition", className: "block text-sm font-medium text-gray-700" }, "Condition *"),
                        React.createElement("select", { id: "condition", name: "condition", value: formData.condition, onChange: handleChange, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500", required: true },
                            React.createElement("option", null, "Working"),
                            React.createElement("option", null, "Not Working"),
                            React.createElement("option", null, "Partially Working"),
                            React.createElement("option", null, "Damaged"))),
                    React.createElement("div", null,
                        React.createElement("label", { htmlFor: "brand", className: "block text-sm font-medium text-gray-700" }, "Brand"),
                        React.createElement("input", { type: "text", name: "brand", id: "brand", value: formData.brand, onChange: handleChange, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" })),
                    React.createElement("div", null,
                        React.createElement("label", { htmlFor: "model", className: "block text-sm font-medium text-gray-700" }, "Model"),
                        React.createElement("input", { type: "text", name: "model", id: "model", value: formData.model, onChange: handleChange, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" })),
                    React.createElement("div", null,
                        React.createElement("label", { htmlFor: "weight", className: "block text-sm font-medium text-gray-700" }, "Weight (kg) *"),
                        React.createElement("input", { type: "number", name: "weight", id: "weight", step: "0.1", value: formData.weight, onChange: handleChange, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500", required: true })),
                    React.createElement("div", null,
                        React.createElement("label", { htmlFor: "location", className: "block text-sm font-medium text-gray-700" }, "Drop-off Location *"),
                        React.createElement("input", { type: "text", name: "location", id: "location", value: formData.location, onChange: handleChange, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500", required: true })),
                    React.createElement("div", { className: "sm:col-span-2" },
                        React.createElement("label", { htmlFor: "description", className: "block text-sm font-medium text-gray-700" }, "Additional Description"),
                        React.createElement("textarea", { name: "description", id: "description", rows: 3, value: formData.description, onChange: handleChange, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500", placeholder: "Any additional details about the item..." }))),
                React.createElement(AIRecommendations, { recommendations: aiRecommendations, loading: aiLoading }),
                React.createElement("div", null,
                    React.createElement("button", { type: "submit", disabled: loading, className: "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed" }, loading ? (React.createElement("div", { className: "flex items-center" },
                        React.createElement("svg", { className: "animate-spin -ml-1 mr-3 h-5 w-5 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24" },
                            React.createElement("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
                            React.createElement("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })),
                        "Submitting...")) : ('Submit E-Waste'))))),
        submittedItemId && (React.createElement("div", { className: "mt-6" },
            React.createElement(BlockchainVerification, { itemId: submittedItemId })))));
}
