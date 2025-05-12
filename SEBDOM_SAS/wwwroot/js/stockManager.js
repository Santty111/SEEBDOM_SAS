// wwwroot/js/stockManager.js

// Configuración centralizada
const stockSettings = {
    referenceRules: [
        { keywords: ['camaron'], value: 100 },
        { keywords: ['uñas de cangrejo', 'uñas cangrejo'], sizes: { 'pp': 66, 'p': 20 } },
        { keywords: ['pulpa de cangrejo', 'pulpa cangrejo'], sizes: { 'pp': 88, 'p': 50 } },
        { keywords: ['almeja'], value: 66 },
        { keywords: ['calamar bb', 'calamar'], sizes: { 'pp': 110, 'p': 110 } },
        { keywords: ['anillos'], value: 100 },
        { keywords: ['pota'], value: 60 },
        { keywords: ['salmon'], value: 50 },
        { keywords: ['pulpa de jaiba', 'pulpa jaiba'], sizes: { 'pp': 20, 'p': 20 } },
        { keywords: ['vieiria'], sizes: { 'pp': 20, 'p': 20 } }
    ],
    alertThreshold: 0.9 // 90% del valor de referencia para alertar
};

// Almacén de alertas ya mostradas (usa localStorage para persistencia)
const ALERT_STORAGE_KEY = 'stockAlertsShown';

// Función principal para manejar todo el stock
function manageStockDisplays() {
    applyStockColorRules();
    checkStockLevels();
}

// Aplica colores a los badges de stock
function applyStockColorRules() {
    document.querySelectorAll('.stock-badge').forEach(badge => {
        const { productName, stock, referenceValue } = getProductInfo(badge);

        // Limpiar clases previas
        badge.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'text-white', 'text-dark');

        if (stock === 0) {
            badge.classList.add('bg-warning', 'text-dark');
        } else if (referenceValue !== undefined) {
            badge.classList.add(
                stock >= referenceValue ? 'bg-success' : 'bg-danger',
                'text-white'
            );
        } else {
            badge.classList.add('bg-secondary', 'text-white');
        }
    });
}

// Verifica niveles de stock y genera alertas
function checkStockLevels() {
    const lowStockProducts = [];
    const criticalStockProducts = [];
    const alertHistory = getAlertHistory();

    document.querySelectorAll('.stock-badge').forEach(badge => {
        const { productName, stock, referenceValue } = getProductInfo(badge);

        if (referenceValue !== undefined && stock > 0) {
            const threshold = referenceValue * stockSettings.alertThreshold;
            const isBelowReference = stock < referenceValue;
            const isCritical = stock < threshold;
            const wasAlerted = alertHistory[productName];
            const shouldAlert = !wasAlerted || (wasAlerted && stock >= referenceValue);

            if (isBelowReference && shouldAlert) {
                const productData = {
                    name: productName,
                    current: stock,
                    expected: referenceValue,
                    percentage: (stock / referenceValue * 100).toFixed(1)
                };

                if (isCritical) {
                    criticalStockProducts.push(productData);
                } else {
                    lowStockProducts.push(productData);
                }

                updateAlertHistory(productName, true);
            } else if (stock >= referenceValue && wasAlerted) {
                updateAlertHistory(productName, false);
            }
        }
    });

    // Mostrar alertas solo si hay productos nuevos
    if (criticalStockProducts.length > 0) {
        showStockAlert('danger', 'Crítico: Stock muy bajo', criticalStockProducts);
    } else if (lowStockProducts.length > 0) {
        showStockAlert('warning', 'Advertencia: Stock bajo', lowStockProducts);
    }
}

// Obtiene el historial de alertas desde localStorage
function getAlertHistory() {
    return JSON.parse(localStorage.getItem(ALERT_STORAGE_KEY)) || {};
}

// Actualiza el historial de alertas
function updateAlertHistory(productName, isAlertActive) {
    const history = getAlertHistory();
    if (isAlertActive) {
        history[productName] = true;
    } else {
        delete history[productName];
    }
    localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(history));
}

// Función auxiliar para obtener información del producto
function getProductInfo(badge) {
    const productName = badge.dataset.product.toLowerCase();
    const stock = parseFloat(badge.dataset.stock);
    let referenceValue;

    const matchedRule = stockSettings.referenceRules.find(rule =>
        rule.keywords.some(keyword => productName.includes(keyword))
    );

    if (matchedRule) {
        referenceValue = matchedRule.value;
        if (matchedRule.sizes) {
            const sizeMatch = productName.match(/\((\w+)\)/);
            const size = sizeMatch ? sizeMatch[1].toLowerCase() : null;
            referenceValue = size ? matchedRule.sizes[size] : Object.values(matchedRule.sizes)[0];
        }
    }

    return { productName, stock, referenceValue };
}

// Muestra alertas en la interfaz
function showStockAlert(type, title, products) {
    const alertId = `stock-alert-${type}`;

    // Eliminar alertas previas del mismo tipo
    const existingAlert = document.getElementById(alertId);
    if (existingAlert) existingAlert.remove();

    const alertContainer = document.createElement('div');
    alertContainer.id = alertId;
    alertContainer.className = `alert alert-${type} alert-dismissible fade show mb-4`;
    alertContainer.setAttribute('role', 'alert');

    let alertHTML = `
        <i class="fas ${type === 'danger' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle'} me-2"></i>
        <strong>${title}:</strong>
        <ul class="mb-1 mt-2">
    `;

    products.forEach(product => {
        alertHTML += `
            <li>
                ${product.name} - 
                Stock: ${product.current} | 
                Mínimo: ${product.expected}
                ${product.percentage ? `(${product.percentage}%)` : ''}
            </li>
        `;
    });

    alertHTML += `
        </ul>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    alertContainer.innerHTML = alertHTML;

    // Insertar después del título principal
    const titleElement = document.querySelector('h1.mb-4');
    if (titleElement) {
        titleElement.insertAdjacentElement('afterend', alertContainer);
    }
}

// Función para resetear alertas manualmente (opcional)
function resetStockAlerts() {
    localStorage.removeItem(ALERT_STORAGE_KEY);
    refreshStockDisplays();
}

// Inicialización
document.addEventListener('DOMContentLoaded', manageStockDisplays);

// Para llamar después de actualizaciones
function refreshStockDisplays() {
    manageStockDisplays();
}

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        manageStockDisplays,
        refreshStockDisplays,
        resetStockAlerts
    };
}