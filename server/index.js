const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite's default port
    methods: ["GET", "POST"],
  },
});

// Initial State (Moved from frontend to server)
let gameState = {
  proPlayers: [
    { name: "Priyanshu", status: "in" },
    { name: "Mrigank", status: "in" },
    { name: "Rajat", status: "in" },
    { name: "Anuj", status: "in" },
  ],
  noobPlayers: [
    { name: "Agarwala", status: "in" },
    { name: "Dhonde", status: "in" },
    { name: "Samarth", status: "in" },
    { name: "Kiran", status: "in" },
    { name: "Sambit", status: "in" },
    { name: "Swarup", status: "in" },
    { name: "Anand", status: "in" },
  ],
  teams: { team1: [], team2: [] },
  lastShuffled: null,
};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Send the current state to the new user immediately
  socket.emit("init_state", gameState);

  // Allow manual state requests
  socket.on("get_state", () => {
    socket.emit("init_state", gameState);
  });

  // Listen for admin updates
  socket.on("update_state", (newState) => {
    gameState = newState;
    // Broadcast the new state to EVERYONE else (viewers)
    socket.broadcast.emit("state_changed", gameState);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.io server running on http://localhost:${PORT}`);
});
