import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = res.locals.token
  !token ? token = authHeader && authHeader.split(' ')[1] : null;

  if (!token) {
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.redirect('/login');
  }
};

export default authMiddleware;
