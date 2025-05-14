using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SEBDOM_SAS.Models;

namespace SEBDOM_SAS.Data
{
    public class SEBDOM_SASContext : DbContext
    {
        public SEBDOM_SASContext(DbContextOptions<SEBDOM_SASContext> options)
            : base(options)
        {
        }

        public DbSet<SEBDOM_SAS.Models.Producto> Producto { get; set; } = default!;

        public DbSet<SEBDOM_SAS.Models.Historial> Historial { get; set; } = default!;

        public DbSet<SEBDOM_SAS.Models.RegistroPulpo> RegistrosPulpo { get; set; } = default!;
        public DbSet<SEBDOM_SAS.Models.ProveedorPrecio> ProveedoresPrecios { get; set; } = default!;
        public DbSet<SEBDOM_SAS.Models.GavetaPulpo> GavetasPulpo { get; set; } = default!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configuración para eliminar en cascada
            modelBuilder.Entity<RegistroPulpo>()
                .HasMany(r => r.ProveedoresPrecios)
                .WithOne(p => p.RegistroPulpo)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RegistroPulpo>()
                .HasMany(r => r.Gavetas)
                .WithOne(g => g.RegistroPulpo)
                .OnDelete(DeleteBehavior.Cascade);
        }


    }
}
