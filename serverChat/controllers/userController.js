import UserService from '../services/userService.js';


class UserController {
   async createUser(req, res) {
        try {
            const userData = req.body;
            // console.log('Creating user with data:', userData);
            const userId = await UserService.createUser(userData);
            res.status(201).json({ message: 'User created successfully', userId });
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async getUserById(req, res) {
        try {
            const userId = req.params.id;
            const user = await UserService.getUserById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.status(200).json(user);
        } catch (error) {
            console.error('Error fetching user:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateUser(req, res) {
        try {
            const userId = req.params.id;
            const userData = req.body;
            await UserService.updateUser(userId, userData);
            res.status(200).json({ message: 'User updated successfully' });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async deleteUser(req, res) {
        try {
            const userId = req.params.id;
            await UserService.deleteUser(userId);
            res.status(200).json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default new UserController();