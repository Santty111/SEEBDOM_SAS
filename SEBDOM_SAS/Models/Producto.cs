using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace SEBDOM_SAS.Models
{
    public enum UnidadMedida
    {
        Kilogramos,
        Libras
    }
    public class Producto
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string NombreProducto { get; set; }

        [NotMapped]
        [Range(0, double.MaxValue, ErrorMessage = "Debe ser un número positivo")]
        public decimal? Entrada { get; set; }

        [NotMapped]
        [Range(0, double.MaxValue, ErrorMessage = "Debe ser un número positivo")]
        public decimal? Salida { get; set; }

        public decimal StockActual { get; set; }

        // Nueva propiedad para la unidad de medida
        public UnidadMedida UnidadMedida { get; set; } = UnidadMedida.Kilogramos; // Valor por defecto
    }
}
