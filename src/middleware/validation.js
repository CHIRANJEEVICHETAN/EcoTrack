import Joi from 'joi';

const wasteSchema = Joi.object({
  itemType: Joi.string().required(),
  weight: Joi.number().positive().required(),
  location: Joi.string().required()
});

export const validateWaste = (req, res, next) => {
  const { error } = wasteSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};