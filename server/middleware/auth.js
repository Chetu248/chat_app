import User from "../models/User.js"
import jwt from "jsonwebtoken"

// middleware to protect route 


export const protectRoute = async (_req , res , next) => {
    try {
        const token = _req.headers.token  

        const decoded = jwt.verify(token , process.env.JWT_SECRET) 

        const user = await User.findById(decoded.userId).select("-password") 

        if(!user) {
            return res.json({success : false , message : "user not found"})
        }

        _req.user = user 
        next() ; 

    } catch(e) {
        console.log(e.message)
        res.json({success : false , message : e.message})
    }
}