const express = require("express");
const app = express();
const path = require("path");

const http = require("http");
const socketIO = require("socket.io");
const server = http.createServer(app);
const io = socketIO(server);

const waitingUsers = [];
const rooms = {};

io.on("connection", (socket) => {
  socket.on("joinroom", () => {
    // console.log(socket.id);
    if (waitingUsers.length > 0) {
      const partner = waitingUsers.shift();
      const roomname = `${socket.id}-${partner.id}`;

      socket.join(roomname);
      partner.join(roomname);

      io.to(roomname).emit("joined", roomname);
    } else {
      waitingUsers.push(socket);
    }
  });

  // socket.on("typing", ({ room }) => {
  //   socket.broadcast.to(room).emit("typing");
  // });

  socket.on("message", (data) => {
    // console.log(data);
    socket.broadcast.to(data.room).emit("message", data.message);
  });


  //videoCall-Part
  socket.on("signalingMessage", (data) => {
    // console.log(data);
    socket.broadcast.to(data.room).emit("signalingMessage", data.message);
  });

  socket.on("startVideoCall", ({ room }) => {
    socket.broadcast.to(room).emit("incomingCall");
  });

  socket.on("acceptCall", ({ room }) => {
    socket.broadcast.to(room).emit("callAccepted");
  });

  socket.on("rejectCall", ({ room }) => {
    socket.broadcast.to(room).emit("callRejected");
  });

  socket.on("disconnect", () => {
    let index = waitingUsers.findIndex(
      (waitingUser) => waitingUser.id === socket.id
    );
    waitingUsers.splice(index, 1);
  });
});

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/Public")));

const indexRouter = require("./routes/index.js");

app.use("/", indexRouter);
server.listen(process.env.PORT || 3000);

// app.listen(3000);
