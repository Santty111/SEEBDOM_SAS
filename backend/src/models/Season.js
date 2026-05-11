import mongoose from 'mongoose';

const seasonSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      unique: true,
    },
    mesInicio: {
      type: Number, // 1-12
      required: true,
    },
    mesFin: {
      type: Number, // 1-12
      required: true,
    },
    descripcion: String,
  },
  { timestamps: true }
);

/**
 * Método estático para determinar la temporada basado en una fecha
 */
seasonSchema.statics.getSeasonByDate = async function(date) {
  const month = date.getMonth() + 1;
  return this.findOne({
    $or: [
      { mesInicio: { $lte: month }, mesFin: { $gte: month } },
      // Caso para temporadas que cruzan el año (ej. Dic-Feb)
      { mesInicio: { $gt: 'mesFin' }, $or: [{ mesInicio: { $lte: month } }, { mesFin: { $gte: month } }] }
    ]
  });
};

const Season = mongoose.models.Season || mongoose.model('Season', seasonSchema);
export default Season;
