import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`SERVER IS RUNNING AT PORT : ${process.env.PORT}`);
    });
  })

  .catch((error) => {
    console.log("\nMONGO DB CONNECTION FAILED !!! \n", error);
  });
