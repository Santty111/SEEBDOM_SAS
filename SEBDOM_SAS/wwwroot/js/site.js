document.querySelectorAll("form").forEach(form => {
    form.addEventListener("submit", function (e) {
        const salida = parseFloat(this.querySelector("[name=Salida]").value);
        const stock = parseFloat(this.querySelector("td:nth-child(5) strong").textContent);
        if (salida > stock) {
            e.preventDefault();
            alert("¡No hay suficiente stock!");
        }
    });
});
