
import AuthService from '../services/authService.js';
import UserService from '../services/userService.js';
class AuthController{
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const token = await AuthService.login(email, password);
            res.status(200).json({ message: 'Login successful', token });
        } catch (error) {
            console.error('Error logging in:', error);
            res.status(401).json({ error: error.message });
        }
    }

    async register(req, res) {
        try {
            const userData = req.body;
            const userId = await UserService.createUser(userData);
            res.status(201).json({ message: 'User registered successfully', userId });
        } catch (error) {
            console.error('Error registering user:', error);
            res.status(400).json({ error: error.message });
        }
    }
}

export default new AuthController();