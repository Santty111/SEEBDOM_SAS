import Category from '../models/Category.js';

export const categoryController = {
  getAllCategories: async (req, res) => {
    try {
      const categories = await Category.find().lean();
      res.json({ success: true, data: { categories } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
