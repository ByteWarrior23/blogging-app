import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({
    path: "./.env",
});

connectDB()
.then(() =>
app.listen(process.env.PORT || 8000 , () =>{
    console.log(`Server is running on port ${process.env.PORT || 8000}`);
}) )
.catch((error) => {
    console.error("Failed to connect to the database:", error)
    process.exit(1)
});

