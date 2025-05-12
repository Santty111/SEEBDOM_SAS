// Controllers/HistorialController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEBDOM_SAS.Data;
using SEBDOM_SAS.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace SEBDOM_SAS.Controllers
{
    public class HistorialController : Controller
    {
        private readonly SEBDOM_SASContext _context;

        public HistorialController(SEBDOM_SASContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index(DateTime? fechaInicio, DateTime? fechaFin, int? productoId)
        {
            IQueryable<Historial> historialQuery = _context.Historial
                .Include(h => h.Producto)
                .OrderByDescending(h => h.Fecha);

            if (fechaInicio.HasValue)
            {
                historialQuery = historialQuery.Where(h => h.Fecha >= fechaInicio);
            }

            if (fechaFin.HasValue)
            {
                historialQuery = historialQuery.Where(h => h.Fecha <= fechaFin.Value.AddDays(1));
            }

            if (productoId.HasValue)
            {
                historialQuery = historialQuery.Where(h => h.ProductoId == productoId);
            }

            ViewBag.Productos = await _context.Producto.ToListAsync();
            return View(await historialQuery.ToListAsync());
        }
    }
}