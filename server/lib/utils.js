import jwt from "jsonwebtoken" 

// fun to generate token for user 

export const generateToken = (userId) => {
    const token = jwt.sign({userId} , process.env.JWT_SECRET) 

    return token 
}
