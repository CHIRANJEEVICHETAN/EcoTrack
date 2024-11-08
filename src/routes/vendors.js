import express from 'express';

export const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const vendors = [
      {
        id: 1,
        name: "EcoRecycle Solutions",
        location: "123 Green Street, Eco City",
        materials: ["Computers", "Mobile Phones", "Batteries"],
        contact: "contact@ecosolutions.com"
      },
      {
        id: 2,
        name: "TechWaste Recyclers",
        location: "456 Sustainability Ave, Green Town",
        materials: ["Laptops", "Printers", "Monitors"],
        contact: "info@techwaste.com"
      }
    ];
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});