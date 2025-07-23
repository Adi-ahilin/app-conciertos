// Módulo con funciones reutilizables para validar la entrada del usuario.

// Valida que la entrada de texto no esté vacía ni sea puramente numérica.
const validarTexto = (input, nombreCampo) => {
  if (input.trim() === '') {
    return `El campo '${nombreCampo}' no puede estar vacío.`;
  }
  if (/^\d+$/.test(input)) {
    return `El campo '${nombreCampo}' no puede ser solo un número.`;
  }
  return true;
};

// Valida que la entrada de fecha cumpla el formato YYYY-MM-DD.
const validarFecha = (input) => {
  if (input.trim() === '') return true;

  const formatoFecha = /^\d{4}-\d{2}-\d{2}$/;
  if (!formatoFecha.test(input)) {
    return 'El formato de fecha debe ser YYYY-MM-DD.';
  }
  const fecha = new Date(input);
  if (isNaN(fecha.getTime())) {
    return 'La fecha introducida no es válida.';
  }
  return true;
};

// Exporta los validadores para su uso en otros módulos.
module.exports = {
  validarTexto,
  validarFecha,
};