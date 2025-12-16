const User = require('../models/User');
const { verifyAadhaar } = require('../utils/mockAadhaar');
const generateToken = require('../utils/generateToken');
const { validationResult } = require('express-validator');
const logAudit = require('../utils/audit');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { fullName, email, password, aadhaarId } = req.body;

        if (!verifyAadhaar(aadhaarId)) {
            return res.status(400).json({ message: 'Invalid Aadhaar Number' });
        }

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        user = new User({
            fullName,
            email,
            password,
            aadhaarId,
            isVerified: false
        });

        const verificationToken = crypto.randomBytes(20).toString('hex');
        user.verificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
        user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 Hours

        await user.save();

        const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

        const message = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Verify Identity</h2>
                <p>Hello ${fullName},</p>
                <p>You registered for a Secure Vault account. Please click below to verify your email:</p>
                <a href="${verifyUrl}" style="background-color: #0F172A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
                <p style="margin-top: 20px; font-size: 12px; color: #666;">If you did not request this, please ignore this email.</p>
            </div>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Action Required: Verify your Government ID',
                message
            });

            // Log Audit
            logAudit({
                action: 'REGISTER',
                actor: user._id,
                ip: req.ip,
                status: 'PENDING_VERIFICATION',
                details: 'User registered, verification email sent'
            });

            res.status(200).json({
                success: true,
                message: `Verification email sent to ${user.email}`
            });

        } catch (emailError) {
            await user.deleteOne(); // Rollback user creation
            console.error("Email sending failed:", emailError);
            return res.status(500).json({ message: 'Email service failed. Please try again.' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Verify User Email
// @route   PUT /api/auth/verifyemail/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
    try {
        const token = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or Expired Token' });
        }

        // Verify User
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;

        await user.save();

        // Log Audit
        logAudit({
            action: 'VERIFY_EMAIL',
            actor: user._id,
            ip: req.ip,
            status: 'SUCCESS',
            details: 'Email verification successful'
        });

        const jwtToken = generateToken(user._id, user.role);
        sendTokenResponse(user, jwtToken, res, 200);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password'); // Ensure password is selected if it's hidden by default

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(401).json({
                message: 'Email not verified. Please check your inbox.'
            });
        }
        const token = generateToken(user._id, user.role);

        // Log Audit
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
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production' ? true : false
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