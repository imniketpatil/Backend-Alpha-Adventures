import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Create Express app
const app = express();

// Define allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://alpha-adventures-client-2cte3wieo-niket-patils-projects.vercel.app",
  "https://alpha-adventures-client.vercel.app",
  "https://alpha-adventures-client-git-main-niket-patils-projects.vercel.app",
  "https://alpha-adventures-admin.vercel.app",
  "https://alpha-adventures-admin-mewzf0ams-niket-patils-projects.vercel.app",
  "https://alpha-adventures-admin-git-main-niket-patils-projects.vercel.app",
  "https://alpha-adventures-client-ga98uix7t-niket-patils-projects.vercel.app",
];

// Configure CORS options
const corsOptions = {
  origin: (origin, callback) => {
    console.log("Evaluating origin:", origin); // Debugging line
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      // Allow requests with no origin (like mobile apps or curl requests)
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PATCH", "DELETE"], // Specify allowed HTTP methods
  credentials: true, // Allow cookies and other credentials to be sent
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Import routes
import userRouter from "./routes/user.routes.js";
import trekGuideRouter from "./routes/trekguide.routes.js";
import trekTypeRouter from "./routes/trektype.routes.js";
import trekRouter from "./routes/trek.routes.js";
import testimonialRouter from "./routes/testimonial.routes.js";

// Route declarations
app.use("/api/v1/users", userRouter);
app.use("/api/v1/trekguide", trekGuideRouter);
app.use("/api/v1/trektype", trekTypeRouter);
app.use("/api/v1/trek", trekRouter);
app.use("/api/v1/testimonial", testimonialRouter);

// Test route
app.get("/connect", (req, res) => {
  res.send("Trek types data");
});

// Error handling middleware

export { app };
