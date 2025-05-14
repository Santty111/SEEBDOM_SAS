using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using SEBDOM_SAS.Data;
using SEBDOM_SAS.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SEBDOM_SAS.Controllers
{
    public class PulposController : Controller
    {
        private readonly SEBDOM_SASContext _context;

        public PulposController(SEBDOM_SASContext context)
        {
            _context = context;
        }

        // GET: Pulpos
        public async Task<IActionResult> Index()
        {
            var fechas = await _context.RegistrosPulpo
                .OrderByDescending(r => r.Fecha)
                .Select(r => r.Fecha.Date)
                .Distinct()
                .ToListAsync();

            return View(fechas);
        }
        // Añade este nuevo método para ver registros por fecha
        public async Task<IActionResult> DetailsByDate(DateTime fecha)
        {
            var registros = await _context.RegistrosPulpo
                .Include(r => r.ProveedoresPrecios)
                .Include(r => r.Gavetas)
                .Where(r => r.Fecha.Date == fecha.Date)
                .ToListAsync();

            if (!registros.Any())
            {
                return NotFound();
            }

            ViewBag.FechaSeleccionada = fecha.ToString("dd/MM/yyyy");
            return View(registros);
        }

        // GET: Pulpos/Create
        public IActionResult Create()
        {
            ViewBag.Codigos = Enum.GetValues(typeof(CodigoPulpo)).Cast<CodigoPulpo>();
            return View();
        }

        // POST: Pulpos/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(DateTime fecha, List<CodigoPulpo> codigosSeleccionados)
        {
            if (codigosSeleccionados == null || !codigosSeleccionados.Any())
            {
                ModelState.AddModelError("", "Debe seleccionar al menos un código");
                ViewBag.Codigos = Enum.GetValues(typeof(CodigoPulpo)).Cast<CodigoPulpo>();
                return View();
            }

            var registro = new RegistroPulpo
            {
                Fecha = fecha,
                CodigosSeleccionados = string.Join(',', codigosSeleccionados)
            };

            _context.Add(registro);
            await _context.SaveChangesAsync();

            return RedirectToAction("AddProveedores", new { id = registro.Id });
        }

        // Añade este método al controlador
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id)
        {
            var registro = await _context.RegistrosPulpo
                .Include(r => r.ProveedoresPrecios)
                .Include(r => r.Gavetas)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (registro == null)
            {
                return NotFound();
            }

            try
            {
                // Eliminar primero los datos relacionados
                _context.ProveedoresPrecios.RemoveRange(registro.ProveedoresPrecios);
                _context.GavetasPulpo.RemoveRange(registro.Gavetas);

                // Luego eliminar el registro principal
                _context.RegistrosPulpo.Remove(registro);

                await _context.SaveChangesAsync();

                TempData["SuccessMessage"] = "Registro eliminado correctamente";
            }
            catch (Exception ex)
            {
                TempData["ErrorMessage"] = $"Error al eliminar: {ex.Message}";
            }

            return RedirectToAction(nameof(Index));
        }

        // GET: Pulpos/AddProveedores/5
        public async Task<IActionResult> AddProveedores(int id)
        {
            var registro = await _context.RegistrosPulpo.FindAsync(id);
            if (registro == null)
            {
                return NotFound();
            }

            ViewBag.Codigos = registro.CodigosLista;
            return View(registro);
        }

        // POST: Pulpos/AddProveedores/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddProveedores(int registroId, IFormCollection form)
        {
            var registro = await _context.RegistrosPulpo.FindAsync(registroId);
            if (registro == null)
            {
                return NotFound();
            }

            // Obtener los códigos del registro
            var codigos = registro.CodigosLista;

            foreach (var codigo in codigos)
            {
                // Obtener los valores del formulario para cada código
                var nombreProveedor = form[$"proveedoresData[{codigo}].Nombre"];
                var precioNormalStr = form[$"proveedoresData[{codigo}].PrecioNormal"];
                var precioEspecialStr = form[$"proveedoresData[{codigo}].PrecioEspecial"];

                // Validar que el nombre del proveedor no esté vacío
                if (string.IsNullOrWhiteSpace(nombreProveedor))
                {
                    ModelState.AddModelError("", $"Debe proporcionar un nombre de proveedor para el código {codigo}");
                    ViewBag.Codigos = codigos;
                    return View(registro);
                }

                // Crear el proveedor
                var proveedor = new ProveedorPrecio
                {
                    Codigo = codigo,
                    NombreProveedor = nombreProveedor,
                    PrecioNormal = decimal.TryParse(precioNormalStr, out var pNormal) ? pNormal : (decimal?)null,
                    PrecioEspecial = decimal.TryParse(precioEspecialStr, out var pEspecial) ? pEspecial : (decimal?)null,
                    RegistroPulpoId = registroId
                };

                _context.Add(proveedor);
            }

            await _context.SaveChangesAsync();
            return RedirectToAction("Details", new { id = registroId });
        }

        // GET: Pulpos/Details/5
        public async Task<IActionResult> Details(int id)
        {
            var registro = await _context.RegistrosPulpo
                .Include(r => r.ProveedoresPrecios)
                .Include(r => r.Gavetas)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (registro == null)
            {
                return NotFound();
            }

            return View(registro);
        }

        // POST: Pulpos/AddGaveta
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddGaveta(int registroId, CodigoPulpo codigo, int numeroGaveta, int cantidad, decimal pesoLbs)
        {
            var gaveta = new GavetaPulpo
            {
                RegistroPulpoId = registroId,
                Codigo = codigo,
                NumeroGaveta = numeroGaveta,
                CantidadPulpos = cantidad,
                PesoLbs = pesoLbs
            };

            _context.Add(gaveta);
            await _context.SaveChangesAsync();
            return RedirectToAction("Details", new { id = registroId });
        }

        // POST: Pulpos/ToggleDisponibilidad/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ToggleDisponibilidad(int gavetaId)
        {
            var gaveta = await _context.GavetasPulpo.FindAsync(gavetaId);
            if (gaveta == null)
            {
                return NotFound();
            }

            gaveta.Disponible = !gaveta.Disponible;
            await _context.SaveChangesAsync();

            return RedirectToAction("Details", new { id = gaveta.RegistroPulpoId });
        }

        [HttpPost]
        public async Task<IActionResult> UpdateField(int id, string field, string value)
        {
            try
            {
                // Determinar si es proveedor o gaveta
                if (field == "nombre" || field == "precioNormal" || field == "precioEspecial")
                {
                    var proveedor = await _context.ProveedoresPrecios.FindAsync(id);
                    if (proveedor == null) return NotFound();

                    switch (field)
                    {
                        case "nombre":
                            proveedor.NombreProveedor = value;
                            break;
                        case "precioNormal":
                            proveedor.PrecioNormal = decimal.Parse(value);
                            break;
                        case "precioEspecial":
                            proveedor.PrecioEspecial = decimal.Parse(value);
                            break;
                    }
                    _context.Update(proveedor);
                }
                else // Es gaveta
                {
                    var gaveta = await _context.GavetasPulpo.FindAsync(id);
                    if (gaveta == null) return NotFound();

                    switch (field)
                    {
                        case "numeroGaveta":
                            gaveta.NumeroGaveta = int.Parse(value);
                            break;
                        case "cantidad":
                            gaveta.CantidadPulpos = int.Parse(value);
                            break;
                        case "pesoLbs":
                            gaveta.PesoLbs = decimal.Parse(value);
                            break;
                    }
                    _context.Update(gaveta);
                }

                await _context.SaveChangesAsync();
                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }
    }



}