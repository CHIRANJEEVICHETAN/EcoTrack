import Joi from 'joi';

const wasteSchema = Joi.object({
  itemType: Joi.string().required(),
  weight: Joi.number().positive().required(),
  location: Joi.string().required(),
  description: Joi.string().allow(''),
  brand: Joi.string().allow(''),
  model: Joi.string().allow('')
});

const vendorSchema = Joi.object({
  name: Joi.string().required(),
  location: Joi.string().required(),
  materials: Joi.array().items(Joi.string()).required(),
  contact: Joi.string().email().required()
});

const recycleDataSchema = Joi.object({
  materialType: Joi.string().required(),
  quantity: Joi.number().positive().required(),
  purityRate: Joi.number().min(0).max(100).required(),
  electricity: Joi.number().min(0).required(),
  water: Joi.number().min(0).required(),
  labor: Joi.number().min(0).required(),
  vendorId: Joi.string().required()
});

export const validateWaste = (req, res, next) => {
  const { error } = wasteSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

export const validateVendor = (req, res, next) => {
  const { error } = vendorSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

export const validateRecycleData = (req, res, next) => {
  const { error } = recycleDataSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};