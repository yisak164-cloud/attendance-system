import express from "express";
import CorrectionRequest from "../models/CorrectionRequest.js";
import Attendance from "../models/Attendance.js";
import authMiddleware from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();


router.post("/", authMiddleware, authorize("student"), async (req,res)=>{
    try {
       const { attendanceId, requestedStatus, reason } = req.body
       
         if (!attendanceId || !requestedStatus || !reason) {
                return res.status(400).json({
                    message: "Attendance ID, requested status and reason are required"
                });
            }

              const validStatuses = ["present", "absent", "late"];

            if (!validStatuses.includes(requestedStatus)) {
                return res.status(400).json({
                    message: "Invalid requested status"
                });
            }

              const attendance = await Attendance.findById(attendanceId);

            if (!attendance) {
                return res.status(404).json({
                    message: "Attendance record not found"
                });
            }

              if (
                attendance.student.toString() !== req.user.userId
            ) {
                return res.status(403).json({
                    message: "You can only request corrections for your own attendance"
                });
            }

             if (attendance.status === requestedStatus) {
                return res.status(400).json({
                    message: "The requested status is already your current attendance status"
                });
            }

            const existingRequest = await CorrectionRequest.findOne({
    attendance: attendanceId,
    status: "pending"
});

if (existingRequest) {
    return res.status(409).json({
        message: "You already have a pending correction request for this attendance"
    });
}

            const correctionRequest = await CorrectionRequest.create({
                attendance: attendanceId,
                student: req.user.userId,
                requestedStatus,
                reason
            })

               return res.status(201).json({
                message: "Correction request submitted successfully",
                correctionRequest
            })
    } catch (error) {
         console.error(error);

            return res.status(500).json({
                message: "Server error"
            })
    }
})


router.get(
    "/",
    authMiddleware,
    authorize("teacher", "admin"),
    async (req, res) => {
        try {
            let query = {};

            if (req.user.role === "teacher") {
                const myAttendanceRecords = await Attendance.find({
                    recordedBy: req.user.userId
                }).select("_id");

                const myAttendanceIds = myAttendanceRecords.map(a => a._id);

                query = { attendance: { $in: myAttendanceIds } };
            }

          const correctionRequests = await CorrectionRequest.find(query)
    .sort({ createdAt: -1 })
    .populate("student", "fullName email")
    .populate({
        path: "attendance",
        populate: [
            { path: "course", select: "course classType" },
            { path: "recordedBy", select: "fullName email" }
        ]
    });

            return res.status(200).json({
                correctionRequests
            });

        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Server error"
            })
        }
    }
)
router.get(
    "/my-requests",
    authMiddleware,
    authorize("student"),
    async (req, res) => {
        try {
            const correctionRequests = await CorrectionRequest.find({
                student: req.user.userId
            })
                .sort({ createdAt: -1 })
                .populate({
                    path: "attendance",
                    populate: {
                        path: "course",
                        select: "course classType"
                    }
                });

            return res.status(200).json({
                correctionRequests
            });

        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Server error"
            });
        }
    }
);

router.put("/:requestId", authMiddleware, authorize("teacher"), async (req,res)=>{

    try {
        const { requestId } = req.params
        const { status } = req.body

        if (!status) {
            return res.status(400).json({
                message: "Status is required"
            });
        }

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({
                message: "Status must be approved or rejected"
            });
        }

        const correctionRequest = await CorrectionRequest.findById(requestId)

        if (!correctionRequest) {
            return res.status(404).json({
                message: "Correction request not found"
            });
        }

        const attendance = await Attendance.findById(correctionRequest.attendance)

        if (!attendance) {
            return res.status(404).json({
                message: "Attendance record not found"
            })
        }

        if (attendance.recordedBy.toString() !== req.user.userId) {
            return res.status(403).json({
                message: "You can only decide on correction requests for attendance you recorded"
            });
        }

        if (correctionRequest.status !== "pending") {
            return res.status(400).json({
                message: "This correction request has already been processed"
            });
        }

        if (status === "approved") {
            attendance.status = correctionRequest.requestedStatus
            await attendance.save()
        }

        correctionRequest.status = status

        await correctionRequest.save()


        return res.status(200).json({
            message: `Correction request ${status} successfully`,
            correctionRequest
        })

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Server error"
        })
    }

})

export default router