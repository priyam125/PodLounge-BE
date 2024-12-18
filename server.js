import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import prisma from './config/db.config.js';
// import setupSocket from './socket.js';
dotenv.config();

//OTP Flow:
// 1. FE send phone number
// 2. Server generate OTP and sends OTP to mobile number
// 3. Server also sends hashed OTP with expiry to FE
// 4. Client sends OTP from phone number/email along with the hashed OTP recieved earlier from server
// 5. Server checks if the OTP is correct by hashing it and comparing it with the hashed OTP sent earlier
// 6. If both hash match, server creates the user if not present and logs the user in
// 7. Server then generates JWT token, saves the refresh token to the DB and sends the refresh and access token to the FE

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(
    {
        origin: 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    }
));
app.use(cookieParser());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.json({ message: 'Hello from the server!' })
})

// Routes
import Routes from "./routes/index.js"
app.use(Routes)

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

// setupSocket(server)