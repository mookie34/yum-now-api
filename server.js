require('dotenv').config({quiet:true}); // Load environment variables from .env
const app = require('./app');
const db=require('./db');
const PORT = process.env.PORT || 3000;
let server; // Server instance reference

// Start the server and connect to the database
const startServer = async () => {
    try{
        // Step 1: Verify database connection
        console.log('trying to connect to the database...');
        await db.query('SELECT NOW()'); // Simple query to verify the connection
        console.log('Database connected successfully.');

        // Step 2: Start the HTTP server
        server = app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
            console.log('Environment:', process.env.NODE_ENV || 'development');
            console.log('Health check endpoint: http://localhost:' + PORT + '/health');
        });
    }
    catch(error){
        console.error('Error starting server:', error.message);
        process.exit(1); // Exit with error code
    }
};

// Gracefully shut down the server and database connection
const gracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    if (server) {
        // Step 1: Stop accepting new requests
        server.close(async() => {
            console.log('HTTP server closed.');

            try{
                // Step 2: Close the database connection
                await db.end();
                console.log('Database connection closed.');
                process.exit(0); // Exit successfully
            }
            catch(error){
                console.error('Error during shutdown:', error.message);
                process.exit(1); // Exit with error code
            }
        });

        // Step 3: Force shutdown after 10 seconds
        setTimeout(() => {
            console.error('Forcing shutdown after 10 seconds.');
            process.exit(1);
        }, 10000);
    }
};

// Listen for OS termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Ctrl+C
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // System kill signal

// Unhandled exception handler
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

startServer(); // Start the server

