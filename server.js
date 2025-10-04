require('dotenv').config({quiet:true}); // Cargar variables de entorno desde un archivo .env
const app = require('./app');
const db=require('./db');
const PORT = process.env.PORT || 3000;
let server; // Variable para almacenar la instancia del servidor

//Función para iniciar el servidor y conectarse a la base de datos
const startServer = async () => {
    try{
        //PASO 1: Verificar la conexión a la base de datos
        console.log('trying to connect to the database...');
        await db.query('SELECT NOW()'); // Consulta simple para verificar la conexión
        console.log('Database connected successfully.');

        //PASO 2: Iniciar el servidor HTTP
        server = app.listen(PORT, () => {
            console.log(`🚀 Server listening on port ${PORT}`);
            console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
            console.log('📡 Health check endpoint: http://localhost:' + PORT + '/health');
        });
    }
    catch(error){
        console.error('Error starting server:', error.message);
        process.exit(1); // Salir del proceso con un código de error
    }
};

//Función para cerrar el servidor y la conexión a la base de datos
const gracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    if (server) {
        //Paso 1: Dejar de aceptar nuevas peticiones
        server.close(async() => {
            console.log('HTTP server closed.');

            try{
                //Paso 2: Cerrar la conexión a la base de datos
                await db.end();
                console.log('Database connection closed.');
                process.exit(0); // Salir del proceso exitosamente
            }
            catch(error){
                console.error('Error during shutdown:', error.message);
                process.exit(1); // Salir del proceso con un código de error
            }
        });

        //Paso 3: Forzar el cierre si no se cierra en 10 segundos
        setTimeout(() => {
            console.error('Forcing shutdown after 10 seconds.');
            process.exit(1);
        }, 10000); 
    }
};

//Escuchar señales de terminación del sistema operativo
process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Ctrl+C
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); //kill del sistema

//manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

startServer(); // Iniciar el servidor

