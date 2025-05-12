// Models/Historial.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEBDOM_SAS.Models
{
    public class Historial
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey("Producto")]
        public int ProductoId { get; set; }
        public Producto Producto { get; set; }

        [Required]
        [DataType(DataType.DateTime)]
        public DateTime Fecha { get; set; } = DateTime.Now;

        [Required]
        [Range(0, double.MaxValue)]
        public decimal Cantidad { get; set; }

        [Required]
        public string TipoMovimiento { get; set; } // "Entrada" o "Salida"

        [Required]
        public decimal StockAnterior { get; set; }

        [Required]
        public decimal StockNuevo { get; set; }

        [StringLength(100)]
        public string Notas { get; set; }
    }
}