using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEBDOM_SAS.Models
{
    public enum CodigoPulpo
    {
        BB, A, AP, P, G, GX, GXX, ROTO, OLOR
    }

    public class RegistroPulpo
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [DataType(DataType.Date)]
        public DateTime Fecha { get; set; } = DateTime.Today;

        public string CodigosSeleccionados { get; set; } // Guardaremos como string separado por comas

        public List<ProveedorPrecio> ProveedoresPrecios { get; set; } = new List<ProveedorPrecio>();
        public List<GavetaPulpo> Gavetas { get; set; } = new List<GavetaPulpo>();

        [NotMapped]
        public List<CodigoPulpo> CodigosLista =>
            string.IsNullOrEmpty(CodigosSeleccionados)
                ? new List<CodigoPulpo>()
                : CodigosSeleccionados.Split(',').Select(c => (CodigoPulpo)Enum.Parse(typeof(CodigoPulpo), c)).ToList();

        [NotMapped]
        public Dictionary<CodigoPulpo, decimal> PesoTotalPorCodigo =>
            Gavetas.GroupBy(g => g.Codigo)
                   .ToDictionary(g => g.Key, g => g.Where(x => x.Disponible).Sum(x => x.PesoLbs));
    }

    public class ProveedorPrecio
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "El nombre del proveedor es obligatorio")]
        [StringLength(100, ErrorMessage = "El nombre no puede exceder 100 caracteres")]
        public string NombreProveedor { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "El precio debe ser positivo")]
        public decimal? PrecioNormal { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "El precio debe ser positivo")]
        public decimal? PrecioEspecial { get; set; }

        [Required]
        public CodigoPulpo Codigo { get; set; }

        [Required]
        public int RegistroPulpoId { get; set; }
        public RegistroPulpo RegistroPulpo { get; set; }
    }

    public class GavetaPulpo
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int NumeroGaveta { get; set; }

        [Required]
        public int CantidadPulpos { get; set; }

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal PesoLbs { get; set; }

        [Required]
        public bool Disponible { get; set; } = true;

        [Required]
        public CodigoPulpo Codigo { get; set; }

        [Required]
        public int RegistroPulpoId { get; set; }
        public RegistroPulpo RegistroPulpo { get; set; }
    }
}