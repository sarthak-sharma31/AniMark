import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const jwtMiddleware = async (req, res, next) => {
  const token = req.session.token;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export default jwtMiddleware;
