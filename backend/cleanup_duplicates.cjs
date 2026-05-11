require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const Product = mongoose.model('Product', new mongoose.Schema({ nombreProducto: String, stockActual: Number }, {strict:false}));
    const products = await Product.find({});
    console.log(`Total products found: ${products.length}`);
    
    const seen = new Map();
    const toDelete = [];
    
    for (const p of products) {
      const nameNorm = (p.nombreProducto || '').trim().toLowerCase();
      if (seen.has(nameNorm)) {
        toDelete.push(p._id);
        // Opcional: si quisieramos sumar el stock al original
        // const original = seen.get(nameNorm);
        // await Product.updateOne({_id: original}, {$inc: {stockActual: p.stockActual || 0}});
      } else {
        seen.set(nameNorm, p._id);
      }
    }
    
    console.log(`Found ${toDelete.length} duplicates to delete.`);
    if (toDelete.length > 0) {
      const res = await Product.deleteMany({ _id: { $in: toDelete } });
      console.log(`Deleted ${res.deletedCount} duplicate products.`);
    }

    // Now recreate the index so Mongoose unique constraint works
    await Product.collection.dropIndex('nombreProducto_1').catch(e => console.log('Index did not exist yet:', e.message));
    await Product.collection.createIndex({ nombreProducto: 1 }, { unique: true });
    console.log('Unique index successfully rebuilt.');

  } catch(e) {
    console.error('Error:', e);
  } finally {
    process.exit(0);
  }
});
