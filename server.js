import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import prisma from "./config/db.config.js";
import http from "http";
import { Server } from "socket.io";
import ACTIONS from "./actions.js";
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

const server = http.createServer(app); // Create a server

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(
  express.json({
    limit: "8mb",
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/storage", express.static("storage"));

app.get("/", (req, res) => {
  res.json({ message: "Hello from the server!" });
});

// Routes
import Routes from "./routes/index.js";
app.use(Routes);

// Sockets

const socketUserMapping = {};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, user }) => {
    console.log("User:", user);

    console.log("Socket User Mapping:", socketUserMapping);
    socketUserMapping[socket.id] = user;
    console.log("Socket User Mapping:", socketUserMapping);

    console.log("RoomId:", roomId);
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

    clients.forEach((clientId) => {
      console.log("Client Id:", clientId);
      io.to(clientId).emit(ACTIONS.ADD_PEER, {
        peerId: socket.id,
        createOffer: false,
        user,
      });

      socket.emit(ACTIONS.ADD_PEER, {
        peerId: clientId,
        createOffer: true,
        user: socketUserMapping[clientId],
      });
    });

    socket.join(roomId);

    console.log("Clients:", clients);
  });

  //Handle Relay Ice
  socket.on(ACTIONS.RELAY_ICE, ({ peerId, icecandidate }) => {
    console.log("IceCandidate:", icecandidate);
    io.to(peerId).emit(ACTIONS.ICE_CANDIDATE, {
      peerId: socket.id,
      icecandidate,
    });
  });

  //Handle Relay Session Description
  socket.on(ACTIONS.RELAY_SDP, ({ peerId, sessionDescription }) => {
    console.log("SessionDescription:", sessionDescription);
    io.to(peerId).emit(ACTIONS.SESSION_DESCRIPTION, {
      peerId: socket.id,
      sessionDescription,
    });
  });

  //Leaving Room
  const leaveRoom = ({ roomId }) => {
    const { rooms } = socket;

    Array.from(rooms).forEach((roomId) => {
      const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

      clients.forEach((clientId) => {
        io.to(clientId).emit(ACTIONS.REMOVE_PEER, {
          peerId: socket.id,
          userId: socketUserMapping[socket.id]?.id,
        });

        socket.emit(ACTIONS.REMOVE_PEER, {
          peerId: clientId,
          userId: socketUserMapping[clientId]?.id,
        });
      });
      socket.leave(roomId);
    });

    delete socketUserMapping[socket.id];
  };
  socket.on(ACTIONS.LEAVE, leaveRoom);

  socket.on("disconnecting", leaveRoom);

  //Handle Disconnect

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
