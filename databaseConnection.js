// Importar y configurar dotenv al principio de todo.
require('dotenv').config();

const { MongoClient } = require('mongodb');

// CAMBIO 2: Leer la variable del archivo .env en lugar de tenerla escrita aquí.
const uri = process.env.MONGO_URI;
const dbName = 'catalogoMusical';
// --------------------

// verificar variable de entorno.
if (!uri) {
  console.error("Error: La variable de entorno MONGO_URI no está definida en el archivo .env");
  process.exit(1);
}

const client = new MongoClient(uri);

async function connectDB() {
  try {
    await client.connect();
    console.log("¡Bienvenido a tu Catálogo Musical de Conciertos! ✅\n");
    return client.db(dbName);
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error);
    process.exit(1); // Salir del programa si no se puede conectar
  }
}

async function closeDB() {
  try {
    await client.close();
    console.log("\nGracias por usar el catálogo. ¡Hasta pronto! 👋");
  } catch (error) {
    console.error("Error al cerrar la conexión:", error);
  }
}

module.exports = { connectDB, closeDB };