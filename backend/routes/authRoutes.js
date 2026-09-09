import express from "express"
import User from "../models/user.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import authMIddleware from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";


const router = express.Router()

router.post("/register", async (req,res)=>{
     try {
         const { fullName, email, password } = req.body

         
          if (!fullName || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

             const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // The role is NOT taken from the request body.
        // Anyone signing up publicly is a student. Only an admin can
        // create a teacher or another admin.
        const user = await User.create({
            fullName,
            email,
            password: hashedPassword,
            role: 'student'
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        })}
 catch (error) {
          console.error(error);

        res.status(500).json({
            message: "Server error"
        });
     }
})

  router.post("/login", async (req,res)=>{
    try {
          const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }
           const user = await User.findOne({ email });
           

        if (!user) {
            return res.status(401).json({
                message: "Invalid email"
            });
        }

          const passwordMatch= await bcrypt.compare(password,user.password)
          
          if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid password"
            });
        }

        const token = jwt.sign(
            {
                userId:user._id,
                role:user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }

            )

           res.cookie("token", token, {
    httpOnly: true,
    secure: false, 
    sameSite: "lax",
    maxAge: 60 * 60 * 1000
})

res.status(200).json({
    message: "Login successful",
    user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
    }
})



    } catch (error) {
         console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
  })

  router.get("/me", authMIddleware , async (req,res)=> {
    res.json({
        message: "You are authenticated",
        user: req.user
    })
  } )

  router.get("/admin-test",authMIddleware,authorize("admin"),(req,res)=>{
    res.json({message : "welcome admin"})
  }

  )


// Admin: get a list of users. Optional filter: /api/auth/users?role=teacher
router.get("/users", authMIddleware, authorize("admin"), async (req, res) => {
    try {
        const filter = {}

        if (req.query.role) {
            filter.role = req.query.role
        }

        const users = await User.find(filter)
            .select("fullName email role")
            .sort({ createdAt: -1 })

        res.status(200).json({ users })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Server error" })
    }
})


// ADMIN creates a user and CHOOSES the role.
// This is the only way a teacher or admin account can be made.
router.post("/users", authMIddleware, authorize("admin"), async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body

        if (!fullName || !email || !password || !role) {
            return res.status(400).json({
                message: "All fields are required"
            })
        }

        if (!["admin", "teacher", "student"].includes(role)) {
            return res.status(400).json({
                message: "Role must be admin, teacher or student"
            })
        }

        const existingUser = await User.findOne({ email })

        if (existingUser) {
            return res.status(409).json({
                message: "Email already exists"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({
            fullName,
            email,
            password: hashedPassword,
            role
        })

        return res.status(201).json({
            message: "User created successfully",
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({ message: "Server error" })
    }
})

// ADMIN changes an existing user's role (promote or demote)
router.patch("/users/:userId/role", authMIddleware, authorize("admin"), async (req, res) => {
    try {
        const { userId } = req.params
        const { role } = req.body

        if (!role) {
            return res.status(400).json({
                message: "Role is required"
            })
        }

        if (!["admin", "teacher", "student"].includes(role)) {
            return res.status(400).json({
                message: "Role must be admin, teacher or student"
            })
        }

        // Stop an admin from demoting themselves and losing access
        if (userId === req.user.userId) {
            return res.status(400).json({
                message: "You cannot change your own role"
            })
        }

        const user = await User.findById(userId)

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        user.role = role

        await user.save()

        return res.status(200).json({
            message: `${user.fullName} is now a ${role}`,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({ message: "Server error" })
    }
})

export default router
