using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEBDOM_SAS.Migrations
{
    /// <inheritdoc />
    public partial class pulpo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RegistrosPulpo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CodigosSeleccionados = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RegistrosPulpo", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GavetasPulpo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NumeroGaveta = table.Column<int>(type: "int", nullable: false),
                    CantidadPulpos = table.Column<int>(type: "int", nullable: false),
                    PesoLbs = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Disponible = table.Column<bool>(type: "bit", nullable: false),
                    Codigo = table.Column<int>(type: "int", nullable: false),
                    RegistroPulpoId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GavetasPulpo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GavetasPulpo_RegistrosPulpo_RegistroPulpoId",
                        column: x => x.RegistroPulpoId,
                        principalTable: "RegistrosPulpo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProveedoresPrecios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreProveedor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PrecioNormal = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    PrecioEspecial = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Codigo = table.Column<int>(type: "int", nullable: false),
                    RegistroPulpoId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProveedoresPrecios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProveedoresPrecios_RegistrosPulpo_RegistroPulpoId",
                        column: x => x.RegistroPulpoId,
                        principalTable: "RegistrosPulpo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GavetasPulpo_RegistroPulpoId",
                table: "GavetasPulpo",
                column: "RegistroPulpoId");

            migrationBuilder.CreateIndex(
                name: "IX_ProveedoresPrecios_RegistroPulpoId",
                table: "ProveedoresPrecios",
                column: "RegistroPulpoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GavetasPulpo");

            migrationBuilder.DropTable(
                name: "ProveedoresPrecios");

            migrationBuilder.DropTable(
                name: "RegistrosPulpo");
        }
    }
}
