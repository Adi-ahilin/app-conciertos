
const concertOperations = require('./crudOperations');

// Exportamos todas las funciones desde módulo de operaciones
module.exports = {
  ...concertOperations,
};