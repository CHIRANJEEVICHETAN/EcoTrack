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
import { useParams, useNavigate } from 'react-router-dom';
import BlockchainVerification from '../components/BlockchainVerification';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
export default function TrackSubmission() {
    var _a;
    const { id } = useParams();
    const navigate = useNavigate();
    const [submissionId, setSubmissionId] = useState(id || '');
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const handleTrack = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        if (!submissionId)
            return;
        setLoading(true);
        setError('');
        try {
            const docRef = doc(db, 'e-waste', submissionId);
            const docSnap = yield getDoc(docRef);
            if (docSnap.exists()) {
                setSubmission(Object.assign({ id: docSnap.id }, docSnap.data()));
                navigate(`/track-submission/${submissionId}`);
            }
            else {
                setError('No submission found with this ID');
            }
        }
        catch (err) {
            console.error('Error fetching submission:', err);
            setError('Error fetching submission details');
        }
        finally {
            setLoading(false);
        }
    });
    const getTrackingUrl = (id) => {
        return `${window.location.origin}/track-submission/${id}`;
    };
    const handleCopyLink = () => __awaiter(this, void 0, void 0, function* () {
        const url = getTrackingUrl(submissionId);
        try {
            yield navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
        }
        catch (err) {
            console.error('Failed to copy:', err);
        }
    });
    return (React.createElement("div", { className: "max-w-3xl mx-auto p-4" },
        React.createElement("h2", { className: "text-2xl font-bold mb-6" }, "Track Submission"),
        React.createElement("form", { onSubmit: handleTrack, className: "mb-8" },
            React.createElement("div", { className: "flex gap-4" },
                React.createElement("input", { type: "text", value: submissionId, onChange: (e) => setSubmissionId(e.target.value), placeholder: "Enter submission ID", className: "flex-1 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" }),
                React.createElement("button", { type: "submit", disabled: loading, className: "px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50" }, loading ? 'Tracking...' : 'Track')),
            error && (React.createElement("p", { className: "mt-2 text-red-600 text-sm" }, error))),
        submission && (React.createElement("div", { className: "space-y-6" },
            React.createElement("div", { className: "bg-white shadow rounded-lg p-6" },
                React.createElement("h3", { className: "text-lg font-medium mb-4" }, "Submission Details"),
                React.createElement("div", { className: "grid grid-cols-2 gap-4" },
                    React.createElement("div", null,
                        React.createElement("p", { className: "text-sm text-gray-500" }, "Item Type"),
                        React.createElement("p", { className: "font-medium" }, submission.itemType)),
                    React.createElement("div", null,
                        React.createElement("p", { className: "text-sm text-gray-500" }, "Status"),
                        React.createElement("p", { className: "font-medium" }, submission.status)),
                    React.createElement("div", null,
                        React.createElement("p", { className: "text-sm text-gray-500" }, "Weight"),
                        React.createElement("p", { className: "font-medium" },
                            submission.weight,
                            " kg")),
                    React.createElement("div", null,
                        React.createElement("p", { className: "text-sm text-gray-500" }, "Location"),
                        React.createElement("p", { className: "font-medium" }, submission.location)),
                    React.createElement("div", null,
                        React.createElement("p", { className: "text-sm text-gray-500" }, "Submitted On"),
                        React.createElement("p", { className: "font-medium" }, (_a = submission.createdAt) === null || _a === void 0 ? void 0 : _a.toDate().toLocaleString())))),
            React.createElement("div", { className: "bg-white shadow rounded-lg p-6" },
                React.createElement("div", { className: "flex justify-between items-start mb-4" },
                    React.createElement("h3", { className: "text-lg font-medium" }, "Track This Submission"),
                    React.createElement("button", { onClick: handleCopyLink, className: "flex items-center text-sm text-green-600 hover:text-green-700" }, copied ? (React.createElement("span", { className: "flex items-center" },
                        React.createElement("svg", { className: "w-5 h-5 mr-1", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                            React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" })),
                        "Copied!")) : (React.createElement("span", { className: "flex items-center" },
                        React.createElement("svg", { className: "w-5 h-5 mr-1", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                            React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" })),
                        "Copy Link")))),
                React.createElement("div", { className: "flex justify-center items-center" },
                    React.createElement(QRCodeSVG, { value: getTrackingUrl(submissionId), size: 200, level: "H", includeMargin: true, className: "border p-2 rounded" })),
                React.createElement("p", { className: "text-center mt-4 text-sm text-gray-500" }, "Scan this QR code to track this submission")),
            React.createElement(BlockchainVerification, { itemId: submissionId })))));
}
