import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import User from "../models/userModel.js";

const router = express.Router();

// Serve the manage links dashboard
router.get('/manage-links', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('sharedLinks');

        res.render('manageLinks', { title: 'Manage Shared Links', sharedLinks: user.sharedLinks });
    } catch (error) {
        console.error('Error fetching shared links:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Increase expiration by 1 day
router.put('/api/shared-links/increase-expiration/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const user = await User.findById(userId);
        const link = user.sharedLinks.find(link => link.id === id);

        if (!link || !link.expiration) {
            return res.status(404).json({ message: 'Link not found or does not have an expiration date' });
        }

        link.expiration = new Date(link.expiration.getTime() + 24 * 60 * 60 * 1000);
        await user.save();

        res.status(200).json({ message: 'Expiration extended' });
    } catch (error) {
        console.error('Error updating expiration:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Decrease expiration by 1 day
router.put('/api/shared-links/decrease-expiration/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const user = await User.findById(userId);
        const link = user.sharedLinks.find(link => link.id === id);

        if (!link || !link.expiration) {
            return res.status(404).json({ message: 'Link not found or does not have an expiration date' });
        }

        link.expiration = new Date(link.expiration.getTime() - 24 * 60 * 60 * 1000);
        await user.save();

        res.status(200).json({ message: 'Expiration reduced' });
    } catch (error) {
        console.error('Error updating expiration:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a shared link
router.delete('/api/shared-links/delete/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const user = await User.findById(userId);
        user.sharedLinks = user.sharedLinks.filter(link => link.id !== id);
        await user.save();

        res.status(200).json({ message: 'Link deleted' });
    } catch (error) {
        console.error('Error deleting link:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


export default router;
