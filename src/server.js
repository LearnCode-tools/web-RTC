import http from "http";
// import WebSocket from "ws";
import SocketIO from "socket.io";
import express from "express";

// admin panel
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on http://localhost:3000");
// app.listen(3000, handleListen); // http only

const server = http.createServer(app); // http
// const wsServer = SocketIO(server); // normal Socket.io

// admin panel ///////////
const wsServer = new Server(server, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});
instrument(wsServer, {
  auth: false,
});
/////////////////////

const getPublicRooms = () => {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
};

const countRoom = (roomName) => {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
};

wsServer.on("connection", (socket) => {
  socket["nickname"] = "Anon";

  socket.onAny((e) => {
    console.log(`Socket Event : ${e}`);
  });

  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    done();
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
    wsServer.sockets.emit("room_change", getPublicRooms());
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
    );
  });

  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", getPublicRooms());
  });

  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
  });

  socket.on("nickname", (nickname) => {
    socket["nickname"] = nickname;
  });
});

// ###################################

// wsServer.on("connection", (socket) => {
//   socket.on("enter_room", (msg, done, ~~) => {
//     console.log(msg);
//     setTimeout(() => {
//       done();
//     }, 5000);
//   });
// });
// FB
// const handleRoomSubmit = (e) => {
//     e.preventDefault();
//     const input = form.querySelector("input");
//     socket.emit("enter_room", { payload: input.value }, () => {
//       console.log("server is done");
//     }, ~~~~ );
//     input.value = "";
//   };
//   form.addEventListener("submit", handleRoomSubmit);

// const wss = new WebSocket.Server({ server }); // http & ws (socket만 사용하고 싶은 경우 Server 안의 {server} 제거)
// const sockets = [];

// wss.on("connection", (socket) => {
//   sockets.push(socket);
//   socket["nickname"] = "Anon";
//   console.log("Connected on Browser ✅");
//   socket.on("close", () => console.log("Disconnected on Browser❌"));
//   socket.on("message", (msg) => {
//     const message = JSON.parse(msg.toString("utf-8"));
//     console.log(message);
//     switch (message.type) {
//       case "new MSG":
//         sockets.forEach((aSocket) =>
//           aSocket.send(`${socket.nickname}: ${message.payload}`)
//         );
//         break;
//       case "nickname":
//         socket["nickname"] = message.payload;
//         break;
//     }
//   });
// });

server.listen(3000, handleListen);
