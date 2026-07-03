const express = require('express');
import {config} from "dotenv";
import { connectDB, disconnectDB} from "./config/db.js";

const app = express();
config();
connectDB();

process.on("unhandledRejection", (err) => {
    console.log('Unhandled Rejection :', err)
    server.close(async () => {  
        await disconnectDB();
        process.exit(1);
    })
});
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception : ", err)
    await disconnectDB();
    process.exit(1);
})
process.on("SIGTERM", async () => {
    console.log("SIGTERM, Shutting Down Gracefully")
    server.close(async () => {
         await disconnectDB();
         process.exit(0);
    });

});

