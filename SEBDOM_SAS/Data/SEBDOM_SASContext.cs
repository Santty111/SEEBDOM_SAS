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
        public SEBDOM_SASContext (DbContextOptions<SEBDOM_SASContext> options)
            : base(options)
        {
        }

        public DbSet<SEBDOM_SAS.Models.Producto> Producto { get; set; } = default!;
    }
}
