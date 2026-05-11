require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Order = mongoose.model('Order', new mongoose.Schema({}, {strict:false}));
  const yearStr = "2025";
  const start = new Date(yearStr, 0, 1);
  const end = new Date(yearStr, 11, 31, 23, 59, 59);
  
  const stats = await Order.aggregate([
    { $match: { estado: 'Despachado', fechaDespacho: { $gte: start, $lte: end } } },
    { $group: { _id: { $month: '$fechaDespacho' }, ingresos: { $sum: '$valorTotal' }, costos: { $sum: '$costoTotal' }, cantidadDespachos: { $sum: 1 } } }
  ]);
  console.log('Stats:', stats);
  process.exit(0);
});
