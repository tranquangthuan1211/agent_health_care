import UserModel from '../models/userModel.js';
import {comparePassword} from '../securities/hashPassword.js';
import {signToken} from '../securities/jwt.js'; // Assuming you have a token generation utility
class AuthService {
    static async login(email, password) {
        // Validate input
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        // Check user credentials
        const user = await UserModel.getUserByEmail(email);
        if (!user) {
            throw new Error('User not found');
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid password');
        }

        // Generate token (assuming a function to generate JWT token)
        const payload = {
            id: user.id,
            role: user.role
        };
        const token = await signToken({
            payload,
            secret: process.env.SECRET_KEY, // Use your secret key from environment variables
            options: { algorithm: 'HS256', expiresIn: '1h' } // Set token expiration as needed
        });
        return token;
    }
    // static async register(userData) {
    //     // Validate input
    //     const { username, phone, address, email, password, role } = userData;
    //     if (!username || !phone || !address || !email || !password) {
    //         throw new Error('All fields are required');
    //     }

    //     // Check if user already exists
    //     const exists = await UserModel.checkUserExists(username);
    //     if (exists) {
    //         throw new Error('Username already exists');
    //     }

    //     // Hash password
    //     const hashedPassword = await hashPassword.hashPassword(password);

    //     // Create user
    //     const userId = await UserModel.createUser({
    //         username,
    //         phone,
    //         address,
    //         email,
    //         password: hashedPassword,
    //         role: role || 'user',
    //         created_at: new Date().toISOString()
    //     });

    //     return userId;
    // }
}
export default AuthService;