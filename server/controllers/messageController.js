import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";

// get all users except logged-in user
export const getUserForSideBar = async (_req, res) => {
    try {
        const userId = _req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password");

        // count unseen messages
        const unseenMessages = {};

        const promises = filteredUsers.map(async (user) => {
            const messages = await Message.find({
                senderId: user._id,      // ✅ fixed: was userId._id
                receiverId: userId,
                seen: false
            });

            if (messages.length > 0) {
                unseenMessages[user._id] = messages.length;   // ✅ fixed: "=" not "-"
            }
        });

        await Promise.all(promises);

        res.json({ success: true, users: filteredUsers, unseenMessages });
    } catch (e) {
        console.log(e.message);
        res.send({ success: false, message: e.message });
    }
};

// get all messages for selected user
export const getMessages = async (_req, res) => {
    try {
        const { id: selectedUserId } = _req.params;
        const myId = _req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId }
            ]
        });

        await Message.updateMany({ senderId: selectedUserId, receiverId: myId }, { seen: true });

        res.json({ success: true, messages });   // ✅ fixed res.json
    } catch (error) {
        console.log(error.message);
    }
};

// api to mark msg as seen
export const markMessageasSeen = async (_req, res) => {
    try {
        const { id } = _req.params;
        await Message.findByIdAndUpdate(id, { seen: true });
        res.json({ success: true });   // ✅ fixed res.json
    } catch (error) {
        console.log(error.message);
    }
};

// send msg to selected user
export const sendMessage = async (_req, res) => {
    try {
        const { text, image } = _req.body;
        const receiverId = _req.params.id;
        const senderId = _req.user._id;

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });

        // emit new msg to receiver socket
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {   // ✅ fixed condition: should check socketId, not receiverId
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.json({ success: true, newMessage });
    } catch (error) {
        console.log(error.message);
    }
};
