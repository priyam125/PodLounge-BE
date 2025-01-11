import crypto from "crypto";
// import { Client } from "twilio"

import twilio from "twilio";
import prisma from "../config/db.config.js";
import jwt from "jsonwebtoken";
import UserDto from "../dtos/user-dto.js";

console.log(crypto.randomBytes(64).toString("hex"));

// console.log(smsSid, smsAuthToken);

const client = twilio(process.env.SMS_SID, process.env.SMS_AUTH_TOKEN, {
  lazyLoading: true,
});

const maxAgeRefreshToken = 30 * 24 * 60 * 60 * 1000; //30 days
const maxAgeAccessToken = 1 * 24 * 60 * 60 * 1000; //1 day

class AuthController {
  static async sendOtp(req, res) {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const otp = crypto.randomInt(1000, 9999);
    const otpExpiry = Date.now() + 2 * 60 * 1000; // 2 minutes from now

    const hashData = `${phone}.${otp.toString()}.${otpExpiry}`;

    const hashedOtp = crypto
      .createHash("sha256", process.env.OTP_HASH_SECRET)
      .update(hashData)
      .digest("hex");

    // client.messages
    //   .create({
    //     to: "+917488847790",
    //     from: "+17755102809",
    //     body: `Your PodLounge otp is ${otp}`,
    //   })
    //   .then((message) => {
    //     console.log("message.sid", message.sid);
    //     // Return the hashed OTP and OTP expiry time to prevent OTP reuse attacks.
    //     // The OTP expiry time is included to ensure the OTP can only be used within a limited time window.
    //     return res.status(200).json({ hash: `${hashedOtp}.${otpExpiry}`, phone });
    //   })
    //   .catch((error) => {
    //     console.error(error);
    //     return res.status(500).json({ error: "Failed to send OTP" });
    //   });

    return res
      .status(200)
      .json({ hash: `${hashedOtp}.${otpExpiry}`, phone, otp });
  }

  static async verifyOtp(req, res) {
    const { otp, phone, hash } = req.body;

    if (!otp || !phone || !hash) {
      return res
        .status(400)
        .json({ error: "OTP and phone number are required" });
    }

    const [hashedOtp, otpExpiry] = hash.split(".");

    if (Date.now() > +otpExpiry) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    const hashData = `${phone}.${otp.toString()}.${otpExpiry}`;

    const calculatedHash = crypto
      .createHash("sha256", process.env.OTP_HASH_SECRET)
      .update(hashData)
      .digest("hex");

    if (calculatedHash !== hashedOtp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    let user;
    let accessToken;
    let refreshToken;

    user = await prisma.user.findFirst({
      where: {
        phone,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
        },
      });
    }

    const jwtPayload = {
      id: user.id,
      phone: user.phone,
    };

    accessToken = jwt.sign(jwtPayload, process.env.JWT_ACCESS_TOKEN_SECRET, {
      expiresIn: "1m",
    });

    refreshToken = jwt.sign(jwtPayload, process.env.JWT_REFRESH_TOKEN_SECRET, {
      expiresIn: "30d",
    });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
      },
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: maxAgeAccessToken,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: maxAgeRefreshToken,
    });

    //send access token as response json

    const userDto = new UserDto(user);

    res.json({
      auth: true,
      user: userDto,
    });
  }

  static async refreshToken(req, res) { 
    const { refreshToken: refreshTokenFromCookie } = req.cookies;

    if (!refreshTokenFromCookie) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      //gets the user id from the refresh token
      const decoded = jwt.verify(
        refreshTokenFromCookie,
        process.env.JWT_REFRESH_TOKEN_SECRET
      );
      //gets the user from the database
      const user = await prisma.user.findUnique({
        where: {
          id: decoded.id,
        },
      });

      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      //Check if refresh token is in the database
      const token = await prisma.refreshToken.findFirst({
        where: {
          userId: user.id,
        },
      });

      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      //Generate new tokens
      const newAccessToken = jwt.sign(
        {
          id: user.id,
          phone: user.phone,
        },
        process.env.JWT_ACCESS_TOKEN_SECRET,
        {
          expiresIn: "1m",
        }
      );

      //generate new refresh token
      const newRefreshToken = jwt.sign(
        {
          id: user.id,
          phone: user.phone,
        },
        process.env.JWT_REFRESH_TOKEN_SECRET,
        {
          expiresIn: "30d",
        }
      );

      //store new refresh token in database
      const existingToken = await prisma.refreshToken.findFirst({
        where: {
          userId: user.id,
        },
      });
      
      if (!existingToken) {
        throw new Error("No refresh token found for this user.");
      }
      
      await prisma.refreshToken.update({
        where: {
          id: existingToken.id, // Use the unique identifier here
        },
        data: {
          token: newRefreshToken,
        },
      });

      //Replace access token in cookies 
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        maxAge: maxAgeAccessToken,
      });

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        maxAge: maxAgeRefreshToken,
      });

      const userDto = new UserDto(user);

      return res.status(200).json({ user: userDto, auth: true });
    } catch (error) {
      console.error(error);
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  static async logout(req, res) {

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    //delete refresh token from database
    try {
      await prisma.refreshToken.delete({
        where: {
          token: refreshToken,
        },
      });
    } catch (error) {
      console.error(error);
    }

    //delete cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.status(200).json({ user: null, auth: false });
  }
}

export default AuthController;
