import http from "http";
// import WebSocket from "ws";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on http://localhost:3000");
// app.listen(3000, handleListen); // http only

const server = http.createServer(app); // http
const wsServer = SocketIO(server);

wsServer.on("connection", (socket) => {
  socket.on("enter_room", (rommName, done) => {
    console.log(rommName);
    setTimeout(() => {
      done("backend is done");
    }, 5000);
  });
});

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
