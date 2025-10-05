import express from "express" 
import "dotenv/config" 
import cors from "cors" 
import http from "http"
import { connectDB } from "./lib/db.js"
import userRouter from "./routes/userRoutes.js"
import messageRouter from "./routes/messageRoutes.js"
import { Server } from "socket.io"

// create express and http server
const app = express() 
const server = http.createServer(app)

// initialise socket.io server
export const io = new Server(server , {
    cors: {origin : "*"}
}) 

// store online users
export const userSocketMap = {}

// socket.io connection handler 
io.on("connection" , (socket)=>{
    const userId = socket.handshake.query.userId
    console.log("user connected" , userId) 

    if(userId) userSocketMap[userId] = socket.id 

    io.emit("getOnlineUsers" , Object.keys(userSocketMap))

    socket.on("disconnect" , ()=>{
        console.log("user disconnected" , userId) 
        delete userSocketMap[userId] 
        io.emit("getOnlineUsers" , Object.keys(userSocketMap))
    })

    
})

// middleware 
app.use(express.json({limit:"4mb"})) 
app.use(cors()) 


// route setup
app.use("/api/status" , (_req , res)=> res.send("server is live")) ; 
app.use("/api/auth" , userRouter) 
app.use("/api/messages" , messageRouter)

// connect to mongodb 
await connectDB()

if(process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 8080 
    server.listen(PORT , ()=> console.log("server is running on port : " + PORT))
}  

// export port for vercel 
export default server ; 
