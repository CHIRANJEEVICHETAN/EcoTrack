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
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
export default function Reports() {
    const { currentUser } = useAuth();
    const [monthlyData, setMonthlyData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [purityData, setPurityData] = useState([]);
    const [resourceData, setResourceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('6months');
    const [stats, setStats] = useState({
        totalItems: 0,
        completedItems: 0,
        pendingItems: 0
    });
    useEffect(() => {
        const fetchData = () => __awaiter(this, void 0, void 0, function* () {
            if (!currentUser)
                return;
            try {
                // Fetch e-waste data
                const wasteQuery = query(collection(db, 'e-waste'), where('userId', '==', currentUser.uid));
                const wasteSnapshot = yield getDocs(wasteQuery);
                const wasteItems = wasteSnapshot.docs.map(doc => {
                    var _a;
                    return (Object.assign(Object.assign({}, doc.data()), { createdAt: (_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate(), status: doc.data().status, itemType: doc.data().itemType }));
                });
                // Calculate stats
                setStats({
                    totalItems: wasteItems.length,
                    completedItems: wasteItems.filter(item => item.status === 'Completed').length,
                    pendingItems: wasteItems.filter(item => item.status === 'Pending').length
                });
                // Process monthly data
                const months = dateRange === '6months' ? 6 : 12;
                const monthlyStats = new Array(months).fill(null).map((_, index) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - index);
                    return {
                        month: date.toLocaleString('default', { month: 'short' }),
                        electronics: 0,
                        batteries: 0,
                        others: 0
                    };
                }).reverse();
                wasteItems.forEach(item => {
                    if (!item.createdAt)
                        return;
                    const itemMonth = item.createdAt.toLocaleString('default', { month: 'short' });
                    const monthData = monthlyStats.find(m => m.month === itemMonth);
                    if (monthData) {
                        if (item.itemType.toLowerCase().includes('computer') || item.itemType.toLowerCase().includes('phone')) {
                            monthData.electronics++;
                        }
                        else if (item.itemType.toLowerCase().includes('battery')) {
                            monthData.batteries++;
                        }
                        else {
                            monthData.others++;
                        }
                    }
                });
                setMonthlyData(monthlyStats);
                // Fetch recycling data
                const recycleQuery = query(collection(db, 'recycleData'));
                const recycleSnapshot = yield getDocs(recycleQuery);
                const recycleItems = recycleSnapshot.docs.map(doc => {
                    var _a;
                    return (Object.assign(Object.assign({}, doc.data()), { timestamp: (_a = doc.data().timestamp) === null || _a === void 0 ? void 0 : _a.toDate() }));
                });
                // Process category data
                const categoryStats = processCategoryData(wasteItems);
                setCategoryData(categoryStats);
                // Process purity data
                const purityRates = {};
                recycleItems.forEach(item => {
                    if (!purityRates[item.materialType]) {
                        purityRates[item.materialType] = [];
                    }
                    purityRates[item.materialType].push(item.purityRate);
                });
                const processedPurityData = Object.entries(purityRates).map(([material, rates]) => ({
                    material,
                    purity: rates.reduce((sum, rate) => sum + rate, 0) / rates.length
                }));
                setPurityData(processedPurityData);
                // Process resource data
                const monthlyResources = {};
                recycleItems.forEach(item => {
                    const month = item.timestamp.toLocaleString('default', { month: 'short' });
                    if (!monthlyResources[month]) {
                        monthlyResources[month] = { electricity: 0, water: 0, labor: 0 };
                    }
                    monthlyResources[month].electricity += item.electricity;
                    monthlyResources[month].water += item.water;
                    monthlyResources[month].labor += item.labor;
                });
                const processedResourceData = Object.entries(monthlyResources).map(([month, resources]) => (Object.assign({ month }, resources)));
                setResourceData(processedResourceData);
            }
            catch (error) {
                console.error('Error fetching report data:', error);
            }
            setLoading(false);
        });
        fetchData();
    }, [currentUser, dateRange]);
    const processCategoryData = (items) => {
        const categories = {};
        items.forEach(item => {
            categories[item.itemType] = (categories[item.itemType] || 0) + 1;
        });
        return Object.entries(categories).map(([name, value]) => ({
            name,
            value
        }));
    };
    const processPurityData = (items) => {
        const purityRates = {};
        items.forEach(item => {
            if (!purityRates[item.materialType]) {
                purityRates[item.materialType] = [];
            }
            purityRates[item.materialType].push(item.purityRate);
        });
        return Object.entries(purityRates).map(([material, rates]) => ({
            material,
            purity: rates.reduce((sum, rate) => sum + rate, 0) / rates.length
        }));
    };
    const processResourceData = (items) => {
        const monthlyResources = {};
        items.forEach(item => {
            const month = item.timestamp.toLocaleString('default', { month: 'short' });
            if (!monthlyResources[month]) {
                monthlyResources[month] = { electricity: 0, water: 0, labor: 0 };
            }
            monthlyResources[month].electricity += item.electricity;
            monthlyResources[month].water += item.water;
            monthlyResources[month].labor += item.labor;
        });
        return Object.entries(monthlyResources).map(([month, resources]) => (Object.assign({ month }, resources)));
    };
    const downloadPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        let yPos = 20;
        const lineHeight = 7;
        // Helper function to add centered text
        const addCenteredText = (text, y, size = 16, style = 'normal') => {
            doc.setFontSize(size);
            doc.setFont('helvetica', style);
            const textWidth = doc.getStringUnitWidth(text) * size / doc.internal.scaleFactor;
            const x = (pageWidth - textWidth) / 2;
            doc.text(text, x, y);
            return y + lineHeight;
        };
        // Helper function to add section title
        const addSectionTitle = (text, y) => {
            doc.setFillColor(34, 197, 94); // Green color
            doc.rect(20, y - 5, pageWidth - 40, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(text, 25, y);
            doc.setTextColor(0, 0, 0);
            return y + lineHeight;
        };
        // Helper function to add table
        const createTable = (headers, data, y) => {
            const cellPadding = 3;
            const cellWidth = (pageWidth - 40) / headers.length;
            const cellHeight = 8;
            // Table headers
            doc.setFillColor(240, 240, 240);
            doc.rect(20, y - 5, pageWidth - 40, cellHeight, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            headers.forEach((header, i) => {
                doc.text(header, 20 + (cellWidth * i) + cellPadding, y);
            });
            // Table rows
            doc.setFont('helvetica', 'normal');
            data.forEach((row, rowIndex) => {
                const rowY = y + ((rowIndex + 1) * cellHeight);
                if (rowY > doc.internal.pageSize.height - 20) {
                    doc.addPage();
                    y = 20;
                    return createTable(headers, data.slice(rowIndex), y);
                }
                row.forEach((cell, cellIndex) => {
                    doc.text(cell, 20 + (cellWidth * cellIndex) + cellPadding, rowY);
                });
            });
            return y + ((data.length + 1) * cellHeight) + 5;
        };
        // Title
        yPos = addCenteredText('EcoTrack Recycling Report', yPos, 24, 'bold');
        yPos += 5;
        // Report Info
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPos);
        doc.text(`User: ${currentUser === null || currentUser === void 0 ? void 0 : currentUser.email}`, pageWidth - 20 - doc.getStringUnitWidth(`User: ${currentUser === null || currentUser === void 0 ? void 0 : currentUser.email}`) * 10 / doc.internal.scaleFactor, yPos);
        yPos += 15;
        // Summary Section
        yPos = addSectionTitle('Summary Statistics', yPos);
        yPos += 10;
        const summaryData = [
            ['Total Items Recycled', `${stats.totalItems}`],
            ['Completed Items', `${stats.completedItems}`],
            ['Pending Items', `${stats.pendingItems}`],
        ];
        summaryData.forEach(([label, value]) => {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(label + ':', 25, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(value, 120, yPos);
            yPos += 7;
        });
        yPos += 10;
        // Monthly Statistics
        yPos = addSectionTitle('Monthly Recycling Statistics', yPos);
        yPos += 10;
        const monthlyHeaders = ['Month', 'Electronics', 'Batteries', 'Others'];
        const monthlyTableData = monthlyData.map(item => [
            item.month,
            item.electronics.toString(),
            item.batteries.toString(),
            item.others.toString()
        ]);
        yPos = createTable(monthlyHeaders, monthlyTableData, yPos);
        yPos += 15;
        // Material Purity Rates
        if (purityData.length > 0) {
            yPos = addSectionTitle('Material Purity Rates', yPos);
            yPos += 10;
            const purityHeaders = ['Material', 'Purity Rate (%)'];
            const purityTableData = purityData.map(item => [
                item.material,
                item.purity.toFixed(1)
            ]);
            yPos = createTable(purityHeaders, purityTableData, yPos);
            yPos += 15;
        }
        // Resource Usage
        if (resourceData.length > 0) {
            if (yPos > doc.internal.pageSize.height - 60) {
                doc.addPage();
                yPos = 20;
            }
            yPos = addSectionTitle('Resource Usage', yPos);
            yPos += 10;
            const resourceHeaders = ['Month', 'Electricity (kWh)', 'Water (L)', 'Labor (hrs)'];
            const resourceTableData = resourceData.map(item => [
                item.month,
                item.electricity.toString(),
                item.water.toString(),
                item.labor.toString()
            ]);
            yPos = createTable(resourceHeaders, resourceTableData, yPos);
        }
        // Footer
        const pageCount = doc.internal.pages.length;
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
            doc.text('Generated by EcoTrack', 20, doc.internal.pageSize.height - 10);
            doc.text(new Date().toLocaleDateString(), pageWidth - 20, doc.internal.pageSize.height - 10, { align: 'right' });
        }
        // Save the PDF
        doc.save('ecotrack-recycling-report.pdf');
    };
    if (loading) {
        return React.createElement("div", { className: "text-center mt-8" }, "Loading...");
    }
    return (React.createElement("div", { className: "max-w-7xl mx-auto" },
        React.createElement("div", { className: "flex justify-between items-center mb-8" },
            React.createElement("h2", { className: "text-3xl font-bold text-gray-900" }, "Recycling Reports"),
            React.createElement("div", { className: "flex gap-4" },
                React.createElement("select", { value: dateRange, onChange: (e) => setDateRange(e.target.value), className: "rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" },
                    React.createElement("option", { value: "6months" }, "Last 6 Months"),
                    React.createElement("option", { value: "12months" }, "Last 12 Months")),
                React.createElement("button", { onClick: downloadPDF, className: "bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors" }, "Download PDF Report"))),
        React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8" },
            React.createElement("div", { className: "bg-white p-6 rounded-lg shadow-md" },
                React.createElement("h3", { className: "text-xl font-semibold mb-4" }, "Monthly Recycling Trends"),
                React.createElement("div", { className: "h-80" },
                    React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
                        React.createElement(BarChart, { data: monthlyData },
                            React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
                            React.createElement(XAxis, { dataKey: "month" }),
                            React.createElement(YAxis, null),
                            React.createElement(Tooltip, null),
                            React.createElement(Legend, null),
                            React.createElement(Bar, { dataKey: "electronics", fill: "#0088FE", name: "Electronics" }),
                            React.createElement(Bar, { dataKey: "batteries", fill: "#00C49F", name: "Batteries" }),
                            React.createElement(Bar, { dataKey: "others", fill: "#FFBB28", name: "Others" }))))),
            React.createElement("div", { className: "bg-white p-6 rounded-lg shadow-md" },
                React.createElement("h3", { className: "text-xl font-semibold mb-4" }, "Category Distribution"),
                React.createElement("div", { className: "h-80" },
                    React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
                        React.createElement(PieChart, null,
                            React.createElement(Pie, { data: categoryData, dataKey: "value", nameKey: "name", cx: "50%", cy: "50%", outerRadius: 100, label: true }, categoryData.map((entry, index) => (React.createElement(Cell, { key: `cell-${index}`, fill: COLORS[index % COLORS.length] })))),
                            React.createElement(Tooltip, null),
                            React.createElement(Legend, null))))),
            React.createElement("div", { className: "bg-white p-6 rounded-lg shadow-md" },
                React.createElement("h3", { className: "text-xl font-semibold mb-4" }, "Material Purity Rates"),
                React.createElement("div", { className: "h-80" },
                    React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
                        React.createElement(BarChart, { data: purityData },
                            React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
                            React.createElement(XAxis, { dataKey: "material" }),
                            React.createElement(YAxis, { domain: [0, 100] }),
                            React.createElement(Tooltip, null),
                            React.createElement(Legend, null),
                            React.createElement(Bar, { dataKey: "purity", fill: "#8884d8", name: "Purity Rate (%)" }))))),
            React.createElement("div", { className: "bg-white p-6 rounded-lg shadow-md" },
                React.createElement("h3", { className: "text-xl font-semibold mb-4" }, "Resource Usage Trends"),
                React.createElement("div", { className: "h-80" },
                    React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
                        React.createElement(LineChart, { data: resourceData },
                            React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
                            React.createElement(XAxis, { dataKey: "month" }),
                            React.createElement(YAxis, null),
                            React.createElement(Tooltip, null),
                            React.createElement(Legend, null),
                            React.createElement(Line, { type: "monotone", dataKey: "electricity", stroke: "#8884d8", name: "Electricity (kWh)" }),
                            React.createElement(Line, { type: "monotone", dataKey: "water", stroke: "#82ca9d", name: "Water (L)" }),
                            React.createElement(Line, { type: "monotone", dataKey: "labor", stroke: "#ffc658", name: "Labor (hrs)" }))))),
            React.createElement("div", { className: "lg:col-span-2" },
                React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6" },
                    React.createElement("div", { className: "bg-white p-6 rounded-lg shadow-md" },
                        React.createElement("h4", { className: "text-lg font-semibold mb-2" }, "Total Items Recycled"),
                        React.createElement("p", { className: "text-3xl font-bold text-green-600" }, categoryData.reduce((sum, item) => sum + item.value, 0))),
                    React.createElement("div", { className: "bg-white p-6 rounded-lg shadow-md" },
                        React.createElement("h4", { className: "text-lg font-semibold mb-2" }, "Average Purity Rate"),
                        React.createElement("p", { className: "text-3xl font-bold text-green-600" },
                            purityData.length > 0
                                ? (purityData.reduce((sum, item) => sum + item.purity, 0) / purityData.length).toFixed(1)
                                : 0,
                            "%")),
                    React.createElement("div", { className: "bg-white p-6 rounded-lg shadow-md" },
                        React.createElement("h4", { className: "text-lg font-semibold mb-2" }, "Total Energy Used"),
                        React.createElement("p", { className: "text-3xl font-bold text-green-600" },
                            resourceData.reduce((sum, item) => sum + item.electricity, 0),
                            " kWh")),
                    React.createElement("div", { className: "bg-white p-6 rounded-lg shadow-md" },
                        React.createElement("h4", { className: "text-lg font-semibold mb-2" }, "Water Consumption"),
                        React.createElement("p", { className: "text-3xl font-bold text-green-600" },
                            resourceData.reduce((sum, item) => sum + item.water, 0),
                            " L")))))));
}
