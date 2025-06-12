import UserModel from '../models/userModel.js';
import { hashPassword } from '../securities/hashPassword.js';
class UserService {
    static async createUser(userData) {
        const { username, phone, address, email, password, role,created_at } = userData;
        const hashedPassword = await hashPassword(password);
        const exits = await UserModel.checkUserExists(username);
        if (!username || !phone || !address || !email || !password) {
            throw new Error('All fields are required');
        }
        if (exits) {
            throw new Error('Username already exists');
        }
        const userId = await UserModel.createUser({
            username,
            phone,
            address,
            email,
            password: hashedPassword,
            role: role || 'user',
            created_at: created_at || new Date().toISOString()

        });
        return userId;
    }
}   

export default UserService;