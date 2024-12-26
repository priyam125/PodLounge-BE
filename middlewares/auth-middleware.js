import jwt from "jsonwebtoken";

export const verifyToken = async (req, res, next) => {
    console.log("req.cookies", req.cookies);
    
    const {accessToken} = req.cookies;

    console.log("accessToken", accessToken);
    if (!accessToken) {
        return res.status(401).send({ error: "Unauthorized" });
    }
    try {
        const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).send({ error: "Token is not valid" });
    }
};