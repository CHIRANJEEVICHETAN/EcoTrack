// import React from 'react';
// import { RecyclingRecommendation } from '../services/aiService';
// interface AIRecommendationsProps {
//   recommendations: RecyclingRecommendation | null;
//   loading: boolean;
// }
// export default function AIRecommendations({ recommendations, loading }: AIRecommendationsProps) {
//   if (loading) {
//     return (
//       <div className="animate-pulse bg-green-50 rounded-lg p-4">
//         <div className="h-4 bg-green-200 rounded w-3/4 mb-3"></div>
//         <div className="h-4 bg-green-200 rounded w-1/2 mb-3"></div>
//         <div className="h-4 bg-green-200 rounded w-2/3"></div>
//       </div>
//     );
//   }
//   if (!recommendations) {
//     return null;
//   }
//   return (
//     <div className="bg-green-50 rounded-lg p-4">
//       <h3 className="text-lg font-semibold text-green-800 mb-3">
//         AI-Generated Recycling Recommendations
//       </h3>
//       <div className="space-y-3">
//         <div>
//           <h4 className="text-sm font-medium text-green-700">Recommended Method:</h4>
//           <p className="text-sm text-green-600">{recommendations.method}</p>
//         </div>
//         <div>
//           <h4 className="text-sm font-medium text-green-700">Environmental Impact:</h4>
//           <p className="text-sm text-green-600">{recommendations.environmentalImpact}</p>
//         </div>
//         <div>
//           <h4 className="text-sm font-medium text-green-700">Additional Notes:</h4>
//           <p className="text-sm text-green-600">{recommendations.additionalNotes}</p>
//         </div>
//       </div>
//     </div>
//   );
// }
import React from 'react';
export default function AIRecommendations({ recommendations, loading }) {
    if (loading) {
        return (React.createElement("div", { className: "animate-pulse bg-green-50 rounded-lg p-4" },
            React.createElement("div", { className: "h-4 bg-green-200 rounded w-3/4 mb-3" }),
            React.createElement("div", { className: "h-4 bg-green-200 rounded w-1/2 mb-3" }),
            React.createElement("div", { className: "h-4 bg-green-200 rounded w-2/3" })));
    }
    if (!recommendations) {
        return null;
    }
    // Split the recommendations into sections based on numbered headers
    const sections = recommendations.split(/\d+\.\s+\*\*[^*]+\*\*:/).filter(Boolean);
    return (React.createElement("div", { className: "bg-green-50 rounded-lg p-4" },
        React.createElement("h3", { className: "text-lg font-semibold text-green-800 mb-3" }, "AI-Generated Recycling Recommendations"),
        React.createElement("div", { className: "space-y-4" }, sections.map((section, index) => {
            const cleanedSection = section.trim().replace(/^\s*-\s*/, '');
            if (!cleanedSection)
                return null;
            return (React.createElement("div", { key: index, className: "prose prose-sm" },
                React.createElement("div", { className: "text-green-600 whitespace-pre-line" }, cleanedSection)));
        }))));
}
