import express from "express";
import Enrollment from "../models/Enrollment.js";
import User from "../models/user.js";
import Course from "../models/Course.js";
import authMiddleware from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";
import TeachingAssignment from "../models/TeachingAssignment.js";

const router = express.Router()

router.post("/",authMiddleware,authorize("admin"), async (req,res)=>{
    try {
         const { studentId, courseId } = req.body;

            if (!studentId || !courseId) {
                return res.status(400).json({
                    message: "Student ID and course ID are required"
                });
            }

            const student = await User.findById(studentId);

            if (!student) {
                return res.status(404).json({
                    message: "Student not found"
                });
            }

            if (student.role !== "student") {
                return res.status(400).json({
                    message: "Selected user is not a student"
                });
            }

            const course = await Course.findById(courseId);

            if (!course) {
                return res.status(404).json({
                    message: "Course not found"
                });
            }

            const existingEnrollment = await Enrollment.findOne({
                student: studentId,
                course: courseId
            });

            if (existingEnrollment) {
                return res.status(409).json({
                    message: "Student is already enrolled in this course"
                });
            }

            const enrollment = await Enrollment.create({
                student: studentId,
                course: courseId
            });

            res.status(201).json({
                message: "Student enrolled successfully",
                enrollment
            });

    } catch (error) {
         console.error(error);

            res.status(500).json({
                message: "Server error"
            });
    }
})

router.get(
    "/course/:courseId/students",
    authMiddleware,
    authorize("teacher"),
    async (req, res) => {
        try {
            const { courseId } = req.params;

            // Check that this teacher is assigned to the course
            const assignment = await TeachingAssignment.findOne({
                teacher: req.user.userId,
                course: courseId
            });

            if (!assignment) {
                return res.status(403).json({
                    message: "You are not assigned to this course"
                });
            }

            // Find students enrolled in the course
            const enrollments = await Enrollment.find({
                course: courseId
            }).populate("student", "fullName email");

            res.status(200).json({
                students: enrollments.map(
                    (enrollment) => enrollment.student
                )
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Server error"
            });
        }
    }
);


// Admin: see every enrollment in the system
router.get("/", authMiddleware, authorize("admin"), async (req, res) => {
    try {
        const { courseId } = req.query

        const filter = {}

        if (courseId) {
            filter.course = courseId
        }

        const enrollments = await Enrollment.find(filter)
            .sort({ createdAt: -1 })
            .populate("student", "fullName email")
            .populate("course", "course classType")

        res.status(200).json({ enrollments })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Server error" })
    }
})

export default router
