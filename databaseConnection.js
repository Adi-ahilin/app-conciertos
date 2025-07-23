require('dotenv').config();

const { MongoClient } = require('mongodb');

// --- Configuración de la Conexión ---
const uri = process.env.MONGO_URI;
const dbName = 'catalogoMusical';

// Valida la existencia de la cadena de conexión antes de continuar
if (!uri) {
  console.error("Error: La variable de entorno MONGO_URI no está definida.");
  process.exit(1);
}

// Inicializa el cliente de MongoDB con la URI de conexión
const client = new MongoClient(uri);

// Función para conectar a la base de datos y devolver la instancia 'db'
async function connectDB() {
  try {
    await client.connect();
    console.log("¡Bienvenido a tu Catálogo Musical de Conciertos! ✅\n");
    return client.db(dbName);
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error);
    process.exit(1); 
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