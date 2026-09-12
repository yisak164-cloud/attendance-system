import express from "express";
import Attendance from "../models/Attendance.js";
import Enrollment from "../models/Enrollment.js";
import TeachingAssignment from "../models/TeachingAssignment.js";
import authMiddleware from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";
import authMIddleware from "../middleware/authMiddleware.js";

const router = express.Router();


router.post("/", authMiddleware, authorize("teacher"), async (req,res)=> {
    const { courseId, date, attendance}= req.body

     try {
        if (!courseId || !date || !attendance) {
                return res.status(400).json({
                    message: "Course, date and attendance are required"
                });
            }

            if (!Array.isArray(attendance) || attendance.length === 0) {
                 return res.status(400).json({
                    message: "Attendance must be a non-empty array"
                });
            }

               const assignment = await TeachingAssignment.findOne({
                teacher: req.user.userId,
                course: courseId
            });

            if (!assignment) {
                return res.status(403).json({
                    message: "You are not assigned to this course"
                });
            }

                const enrollments = await Enrollment.find({
                    course: courseId
                })

                const enrollmentStudentIds = enrollments.map((enrollment)=> enrollment.student.toString())

                for (const record of attendance) {
                    if (!enrollmentStudentIds.includes(record.studentId)) {
                         return res.status(400).json({
            message: "One or more students are not enrolled in this course"
        });
                    }
                }

                const validStatuses = ["present", "absent", "late"];

for (const record of attendance) {
    if (!validStatuses.includes(record.status)) {
        return res.status(400).json({
            message: "Invalid attendance status"
        });
    }
}

if (attendance.length !== enrollments.length) {
    return res.status(400).json({
        message: "Attendance must be submitted for all enrolled students"
    });
}

const submittedStudentIds = attendance.map(record=> record.studentId)

const uniqueStudentIds = new Set(submittedStudentIds)

if (uniqueStudentIds.size !== submittedStudentIds.length) {
    return res.status(400).json({
        message: "A student appears more than once in the attendance"
    });  
}

const attendanceDate = new Date(`${date}T00:00:00.000Z`)
                
const attendanceRecords = attendance.map((record) => ({
    student: record.studentId,
    course: courseId,
    date: attendanceDate,
    status: record.status,
    recordedBy: req.user.userId
}));

const savedAttendance = await Attendance.insertMany(
    attendanceRecords
);

return res.status(201).json({
    message: "Attendance recorded successfully",
    attendance: savedAttendance
});
            
     } catch (error) {
        console.error(error);

          if (error.code === 11000) {
        return res.status(409).json({
            message: "Attendance has already been recorded for this course and date"
        });
    }
            res.status(500).json({
                message: "Server error"
            });
     }
})

router.get("/my-attendance",authMiddleware,authorize("student"), async (req,res)=> {
    try {
        const attendance = await Attendance.find({
            student: req.user.userId
        }).populate("course", "course classType").populate("recordedBy", "fullName")

        return res.status(200).json({
            attendance
        })
    } catch (error) {
         console.error(error);

            return res.status(500).json({
                message: "Server error"
            })
    }

})

router.get("/course/:courseId", authMiddleware, authorize("teacher"), async (req,res)=> {
    try {
        const {courseId} = req.params
        const {date} = req.query

          const assignment = await TeachingAssignment.findOne({
                teacher: req.user.userId,
                course: courseId
            });

            if (!assignment) {
                return res.status(403).json({
                    message: "You are not assigned to this course"
                });
            }

            const filter = {course:courseId}

            if (date) {
                filter.date = new Date(`${date}T00:00:00.000Z`)
            }

            const attendance = await Attendance.find(filter).sort({ date: -1 }).populate("student", "fullName email").populate("course", "course classType").populate("recordedBy", "fullName")

             return res.status(200).json({
                attendance
            })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: "Server error"
        })
    }
})

router.put("/:attendanceId", authMIddleware, authorize("teacher"), async (req,res)=>{
    try {
        const {attendanceId} = req.params
        const {status} = req.body

        if(!status) {
            return res.status(400).json({
                    message: "Status is required"
                })
        }

        const validStatuses = ["present", "absent", "late"]

        if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid attendance status"
                })
            }

            
            const attendanceRecord = await Attendance.findById(
                attendanceId
            )

             if (!attendanceRecord) {
                return res.status(404).json({
                    message: "Attendance record not found"
                });
            }

             const assignment = await TeachingAssignment.findOne({
                teacher: req.user.userId,
                course: attendanceRecord.course
            });

            if (!assignment) {
                return res.status(403).json({
                    message: "You are not assigned to this course"
                });
            }

             attendanceRecord.status = status;

            await attendanceRecord.save();

            return res.status(200).json({
                message: "Attendance updated successfully",
                attendance: attendanceRecord
            })


    } catch (error) {
         console.error(error);

            return res.status(500).json({
                message: "Server error"
            })
    }
})



router.get("/all", authMiddleware, authorize("admin"), async (req, res) => {
    try {
        const { courseId, date } = req.query

        const filter = {}

        if (courseId) {
            filter.course = courseId
        }

        if (date) {
            filter.date = new Date(`${date}T00:00:00.000Z`)
        }

        const attendance = await Attendance.find(filter)
            .sort({ date: -1 })
            .populate("student", "fullName email")
            .populate("course", "course classType")
            .populate("recordedBy", "fullName")

        return res.status(200).json({ attendance })

    } catch (error) {
        console.error(error)

        return res.status(500).json({ message: "Server error" })
    }
})

export default router
