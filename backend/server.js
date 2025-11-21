import express from "express";
import { createServer } from "node:http"; //here we use node:http for creating server
import { Server } from "socket.io"; // for socket.io
const app = express();
const server = createServer(app); // create server using node:http

// create socket.io server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // frontend server address
    methods: ["GET", "POST"],
  },
}); // initialize socket.io with the server
const Room = "group";
io.on("connection", (socket) => {
  //io.on --> listens for events
  console.log("a user connected", socket.id);

  socket.on("joinRoom", async (username) => {
    //listen for joinRoom event
    console.log(`User : ${username} joined room:}`);
    await socket.join(Room); // join the user to a room

    socket.to(Room).emit("roomNotice", username); //send roomNotice to all users in the room
    //room is  a concept in socket.io to group sockets together
  });

  socket.on("chatMessage", (message) => {
    socket.to(Room).emit("chatMessage", message); // broadcast the message to other users in the room all except sender
  });

  socket.on("typing", (username) => {
    socket.to(Room).emit("typing", username); // broadcast typing event to other users in the room
  });
  socket.on("stopTyping", (username) => {
    socket.to(Room).emit("stopTyping", username); // broadcast stopTyping event to other users in the room
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
