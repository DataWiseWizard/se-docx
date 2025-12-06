const User = require('../models/User');
const { verifyAadhaar } = require('../utils/mockAadhaar');
const generateToken = require('../utils/generateToken');
const { validationResult } = require('express-validator');
const logAudit = require('../utils/audit');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { aadhaarId, fullName, email, password } = req.body;

    try {
        let user = await User.findOne({ $or: [{ email }, { aadhaarId }] });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const aadhaarCheck = verifyAadhaar(aadhaarId);
        if (!aadhaarCheck.isValid) {
            return res.status(400).json({ message: aadhaarCheck.message });
        }

        user = await User.create({
            aadhaarId,
            fullName,
            email,
            password,
            isVerified: true
        });

        const token = generateToken(user._id, user.role);
        sendTokenResponse(user, token, res, 201);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user._id, user.role);
        logAudit({
            action: 'LOGIN',
            actor: user._id,
            ip: req.ip,
            status: 'SUCCESS',
            details: 'User logged in via Password'
        });
        sendTokenResponse(user, token, res, 200);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
exports.logout = (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({ message: 'User logged out' });
};

const sendTokenResponse = (user, token, res, statusCode) => {
    const options = {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV,
        sameSite: 'strict'
    };

    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.fullName,
                email: user.email,
                role: user.role
            }
        });
};