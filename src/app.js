import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Define allowed origins
const allowedOrigins = [
  "https://alpha-adventures-client.onrender.com",
  "https://alpha-adventures-admin.onrender.com",
];

// Configure CORS options
const corsOptions = {
  origin: (origin, callback) => {
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

export { app };
