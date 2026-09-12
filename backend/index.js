import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import dns from "dns"

import DB from "./config/db.js"
import authRoutes from "./routes/authRoutes.js"
import studentRoutes from "./routes/studentRoutes.js"
import enrollmentRoutes from "./routes/enrollmentRoutes.js"
import courseRoutes from "./routes/courseRoutes.js"
import teachingRoutes from "./routes/teachingRoutes.js"
import attendanceRoutes from "./routes/attendanceRoutes.js"
import correctionRequestRoutes from "./routes/correctionRequestRoutes.js"
import teacherAttendanceRoutes from "./routes/teacherAttendanceRoutes.js"
import cookieParser from "cookie-parser"

// Load the .env file FIRST, so every line below can read process.env
dotenv.config()


if (!process.env.VERCEL) {
    dns.setServers(["8.8.8.8", "8.8.4.4"])
}

const app = express()
const PORT = process.env.PORT || 3000

DB()


app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}))

app.use(cookieParser())

app.use(express.json())

app.get("/", (req, res) => {
    res.status(200).send({ message: "attendance app is running" })
})

const api = express.Router()

api.use("/auth", authRoutes)
api.use("/students", studentRoutes)
api.use("/enrollments", enrollmentRoutes)
api.use("/courses", courseRoutes)
api.use("/teaching", teachingRoutes)
api.use("/attendance", attendanceRoutes)
api.use("/correction-requests", correctionRequestRoutes)
api.use("/teacher-attendance", teacherAttendanceRoutes)

// Mounted twice on purpose: some hosts forward the full path ("/api/auth/login")
// while others strip the prefix first ("/auth/login"). This handles both.
app.use("/api", api)
app.use("/", api)

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`)
})

export default app
