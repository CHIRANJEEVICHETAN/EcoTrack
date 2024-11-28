import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User } from 'firebase/auth';

export interface WasteItem {
  createdAt: Date;
  status: string;
  itemType: string;
  weight: number;
  userId: string;
  userEmail: string;
}

export interface RecycleData {
  materialType: string;
  quantity: number;
  purityRate: number;
  electricity: number;
  water: number;
  labor: number;
  timestamp: Date;
  vendorId?: string;
}

export const fetchReportData = async (currentUser: User | null) => {
  if (!currentUser) return null;

  const isAdmin = currentUser.email === 'admin@ecotrack.com';
  const isVendor = currentUser.email?.endsWith('@vendor.ecotrack.com');

  try {
    // Base query for e-waste items
    let wasteQuery;
    if (isAdmin) {
      // Admin sees all items
      wasteQuery = query(collection(db, 'e-waste'));
    } else if (isVendor) {
      // Vendor sees items assigned to them
      wasteQuery = query(collection(db, 'e-waste'), where('vendorId', '==', currentUser.uid));
    } else {
      // Regular user sees their own items
      wasteQuery = query(collection(db, 'e-waste'), where('userId', '==', currentUser.uid));
    }

    const wasteSnapshot = await getDocs(wasteQuery);
    const wasteItems = wasteSnapshot.docs.map(doc => {
      const data = doc.data() as { createdAt: any } & Partial<WasteItem>;
      return {
        ...(data as Omit<WasteItem, 'createdAt'>),
        createdAt: data.createdAt?.toDate?.() || new Date(),
        id: doc.id,
      } as WasteItem;
    });

    // Fetch recycling data
    let recycleQuery;
    if (isAdmin) {
      recycleQuery = query(collection(db, 'recycleData'));
    } else if (isVendor) {
      recycleQuery = query(collection(db, 'recycleData'), where('vendorId', '==', currentUser.uid));
    } else {
      recycleQuery = query(collection(db, 'recycleData'), where('userId', '==', currentUser.uid));
    }

    const recycleSnapshot = await getDocs(recycleQuery);
    const recycleItems = recycleSnapshot.docs.map(doc => {
      const data = doc.data() as { timestamp: any } & Partial<RecycleData>;
      return {
        ...(data as Omit<RecycleData, 'timestamp'>),
        timestamp: data.timestamp?.toDate?.() || new Date(),
        id: doc.id,
      } as RecycleData;
    });

    // Calculate statistics
    const totalItems = wasteItems.length;
    
    // Calculate total weight with proper validation and maximum limits
    const totalWeight = wasteItems.reduce((sum, item) => {
      // Convert weight to number and validate
      const weight = typeof item.weight === 'string' ? parseFloat(item.weight) : item.weight;
      
      // Skip invalid weights or weights over 1000kg (reasonable maximum for e-waste items)
      if (isNaN(weight) || weight < 0 || weight > 1000) {
        return sum;
      }
      return sum + weight;
    }, 0);
    
    // Updated environmental impact calculations with strict limits
    // CO2 savings: 0.1 kg CO2 per kg of e-waste (very conservative estimate)
    // Tree absorption: 200 kg CO2 per tree per year (realistic mature tree value)
    const carbonSaved = Math.min(totalWeight * 0.1, 1000000);  // Cap at 1000 tons CO2
    const treesEquivalent = Math.min(carbonSaved / 200, 5000);  // Cap at 5000 trees

    // Process monthly data
    const monthlyStats = processMonthlyData(wasteItems);
    const categoryStats = processCategoryData(wasteItems);
    const purityData = processPurityData(recycleItems);
    const resourceData = processResourceData(recycleItems);

    return {
      wasteItems,
      recycleItems,
      stats: {
        totalItems,
        completedItems: wasteItems.filter(item => item.status === 'Completed').length,
        pendingItems: wasteItems.filter(item => item.status === 'Pending').length,
        totalWeight,
        carbonSaved,
        treesEquivalent,
      },
      monthlyData: monthlyStats,
      categoryData: categoryStats,
      purityData,
      resourceData,
    };
  } catch (error) {
    console.error('Error fetching report data:', error);
    throw new Error('Failed to fetch report data');
  }
};

const processMonthlyData = (items: WasteItem[]) => {
  const monthlyStats = new Array(12).fill(null).map((_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - index);
    return {
      month: date.toLocaleString('default', { month: 'short' }),
      electronics: 0,
      batteries: 0,
      others: 0,
    };
  }).reverse();

  items.forEach(item => {
    if (!item.createdAt) return;
    const itemMonth = item.createdAt.toLocaleString('default', { month: 'short' });
    const monthData = monthlyStats.find(m => m.month === itemMonth);
    if (monthData) {
      if (item.itemType.toLowerCase().includes('computer') || item.itemType.toLowerCase().includes('phone')) {
        monthData.electronics++;
      } else if (item.itemType.toLowerCase().includes('battery')) {
        monthData.batteries++;
      } else {
        monthData.others++;
      }
    }
  });

  return monthlyStats;
};

const processCategoryData = (items: WasteItem[]) => {
  const categories: { [key: string]: number } = {};
  items.forEach(item => {
    categories[item.itemType] = (categories[item.itemType] || 0) + 1;
  });

  return Object.entries(categories).map(([name, value]) => ({
    name,
    value,
  }));
};

const processPurityData = (items: RecycleData[]) => {
  const purityRates: { [key: string]: number[] } = {};
  items.forEach(item => {
    if (!purityRates[item.materialType]) {
      purityRates[item.materialType] = [];
    }
    purityRates[item.materialType].push(item.purityRate);
  });

  return Object.entries(purityRates).map(([material, rates]) => ({
    material,
    purity: rates.reduce((sum, rate) => sum + rate, 0) / rates.length,
  }));
};

const processResourceData = (items: RecycleData[]) => {
  const monthlyResources: { [key: string]: { electricity: number; water: number; labor: number; } } = {};
  items.forEach(item => {
    const month = item.timestamp.toLocaleString('default', { month: 'short' });
    if (!monthlyResources[month]) {
      monthlyResources[month] = { electricity: 0, water: 0, labor: 0 };
    }
    monthlyResources[month].electricity += item.electricity;
    monthlyResources[month].water += item.water;
    monthlyResources[month].labor += item.labor;
  });

  return Object.entries(monthlyResources).map(([month, resources]) => ({
    month,
    ...resources,
  }));
};