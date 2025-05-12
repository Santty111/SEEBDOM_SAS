using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using SEBDOM_SAS.Data;
using SEBDOM_SAS.Models;

namespace SEBDOM_SAS.Controllers
{
    public class ProductosController : Controller
    {
        private readonly SEBDOM_SASContext _context;

        public ProductosController(SEBDOM_SASContext context)
        {
            _context = context;
        }

        // GET: Productos
        public async Task<IActionResult> Index()
        {
            return View(await _context.Producto.ToListAsync());
        }

        // GET: Productos/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var producto = await _context.Producto
                .FirstOrDefaultAsync(m => m.Id == id);
            if (producto == null)
            {
                return NotFound();
            }

            return View(producto);
        }

        // GET: Productos/Create
        public IActionResult Create()
        {
            return View();
        }

        // POST: Productos/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to.
        // For more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("Id,NombreProducto")] Producto producto)
        {
            if (ModelState.IsValid)
            {
                producto.StockActual = 0; // inicializamos stock
                _context.Add(producto);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(producto);
        }

        // GET: Productos/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var producto = await _context.Producto.FindAsync(id);
            if (producto == null)
            {
                return NotFound();
            }
            return View(producto);
        }

        // POST: Productos/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to.
        // For more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(
            int Id,
            [Bind("Id,UnidadMedida,Entrada,Salida")] Producto productoActualizado)
        {
            var producto = await _context.Producto.FindAsync(Id);
            if (producto == null)
            {
                return NotFound();
            }

            // Registrar historial antes de cualquier cambio
            decimal stockAnterior = producto.StockActual;

            // 1. Verificar cambio de unidad de medida
            if (producto.UnidadMedida != productoActualizado.UnidadMedida)
            {
                // Registrar cambio de unidad en el historial
                var historialCambioUnidad = new Historial
                {
                    ProductoId = producto.Id,
                    Fecha = DateTime.Now,
                    TipoMovimiento = "Ajuste",
                    Cantidad = 0,
                    StockAnterior = stockAnterior,
                    StockNuevo = stockAnterior,
                    Notas = $"Cambio de unidad de {producto.UnidadMedida} a {productoActualizado.UnidadMedida}"
                };
                _context.Historial.Add(historialCambioUnidad);

                // Conversión de unidades
                if (productoActualizado.UnidadMedida == UnidadMedida.Libras)
                {
                    producto.StockActual *= 2.20462m;
                }
                else
                {
                    producto.StockActual *= 0.453592m;
                }
            }

            // 2. Actualizar unidad de medida
            producto.UnidadMedida = productoActualizado.UnidadMedida;

            // 3. Procesar entradas
            if (productoActualizado.Entrada.HasValue && productoActualizado.Entrada.Value > 0)
            {
                producto.StockActual += productoActualizado.Entrada.Value;

                var historialEntrada = new Historial
                {
                    ProductoId = producto.Id,
                    Fecha = DateTime.Now,
                    TipoMovimiento = "Entrada",
                    Cantidad = productoActualizado.Entrada.Value,
                    StockAnterior = stockAnterior,
                    StockNuevo = producto.StockActual,
                    Notas = "Registro de entrada"
                };
                _context.Historial.Add(historialEntrada);
            }

            // 4. Procesar salidas
            if (productoActualizado.Salida.HasValue && productoActualizado.Salida.Value > 0)
            {
                if (producto.StockActual < productoActualizado.Salida.Value)
                {
                    decimal diferencia = producto.StockActual - productoActualizado.Salida.Value;
                    TempData["AlertaStock"] = $"El stock actual es menor!{Environment.NewLine}Faltante = {diferencia.ToString("0.00")} {producto.UnidadMedida}";
                    return RedirectToAction(nameof(Index));
                }

                producto.StockActual -= productoActualizado.Salida.Value;

                var historialSalida = new Historial
                {
                    ProductoId = producto.Id,
                    Fecha = DateTime.Now,
                    TipoMovimiento = "Salida",
                    Cantidad = productoActualizado.Salida.Value,
                    StockAnterior = stockAnterior,
                    StockNuevo = producto.StockActual,
                    Notas = "Registro de salida"
                };
                _context.Historial.Add(historialSalida);
            }

            try
            {
                _context.Update(producto);
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductoExists(producto.Id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return RedirectToAction(nameof(Index));
        }

        // GET: Productos/Delete/5
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var producto = await _context.Producto
                .FirstOrDefaultAsync(m => m.Id == id);
            if (producto == null)
            {
                return NotFound();
            }

            return View(producto);
        }

        // POST: Productos/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var producto = await _context.Producto.FindAsync(id);
            if (producto != null)
            {
                _context.Producto.Remove(producto);
            }

            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        private bool ProductoExists(int id)
        {
            return _context.Producto.Any(e => e.Id == id);
        }
    }
}
