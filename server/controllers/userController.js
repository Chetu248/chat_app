import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// signup user
export const signup = async (_req, res) => {
    const { fullName, email, password, bio } = _req.body;
    try {
        if (!fullName || !email || !password || !bio) {
            return res.json({ success: false, message: "Missing Details" });
        }

        const user = await User.findOne({ email });
        if (user) {
            return res.json({ success: false, message: "Account already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName, email, password: hashedPassword, bio
        });

        const token = generateToken(newUser._id);

        // ✅ fixed typo "sucess"
        res.json({ success: true, userData: newUser, token, message: "Account created successfully" });
    } catch (e) {
        console.log(e.message);
        res.json({ success: false, message: e.message });
    }
};

// login user
export const login = async (_req, res) => {
    try {
        const { email, password } = _req.body;

        // ✅ fixed: use findOne instead of find
        const userData = await User.findOne({ email });

        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }

        // ✅ compare correctly
        const isPasswordCorrect = await bcrypt.compare(password, userData.password);

        if (!isPasswordCorrect) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        // ✅ fixed: newData → userData
        const token = generateToken(userData._id);

        res.json({ success: true, userData, token, message: "Login successfully" });
    } catch (e) {
        console.log(e.message);
        res.json({ success: false, message: e.message });
    }
};

// controller to check if user is authenticated
export const checkAuth = (_req, res) => {
    res.json({ success: true, userData: _req.user });
};

// controller to update profile details
export const updateProfile = async (_req, res) => {
    try {
        const { profilePic, bio, fullName } = _req.body;
        const userId = _req.user._id;
        let updatedUser;

        if (!profilePic) {
            updatedUser = await User.findByIdAndUpdate(
                userId,
                { bio, fullName },
                { new: true }
            );
        } else {
            const upload = await cloudinary.uploader.upload(profilePic);

            updatedUser = await User.findByIdAndUpdate(
                userId,
                { profilePic: upload.secure_url, bio, fullName },
                { new: true }
            );
        }
        res.json({ success: true, user: updatedUser });
    } catch (e) {
        console.log(e.message);
        res.json({ success: false, message: e.message });
    }
};
