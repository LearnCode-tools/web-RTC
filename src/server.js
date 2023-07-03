import http from "http";
import WebSocket from "ws";
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
const wss = new WebSocket.Server({ server }); // http & ws (socket만 사용하고 싶은 경우 Server 안의 {server} 제거)

const sockets = [];

wss.on("connection", (socket) => {
  sockets.push(socket);
  socket["nickname"] = "Anon";
  console.log("Connected on Browser ✅");
  socket.on("close", () => console.log("Disconnected on Browser❌"));
  socket.on("message", (msg) => {
    const message = JSON.parse(msg.toString("utf-8"));
    console.log(message);
    switch (message.type) {
      case "new MSG":
        sockets.forEach((aSocket) =>
          aSocket.send(`${socket.nickname}: ${message.payload}`)
        );
        break;
      case "nickname":
        socket["nickname"] = message.payload;
        break;
    }
  });
});

server.listen(3000, handleListen);
