# Socket Memo

## normal socket.io setting

### Server

```javascript
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

const io = SocketIO(server);

const getPublicRooms = () => {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = io;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
};

const countRoom = (roomName) => {
  return io.sockets.adapter.rooms.get(roomName)?.size;
};

io.on("connection", (socket) => {
  socket["nickname"] = "Anon";

  socket.onAny((e) => {
    console.log(`Socket Event : ${e}`);
  });

  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    done();
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
    io.sockets.emit("room_change", getPublicRooms());
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
    );
  });

  socket.on("disconnect", () => {
    io.sockets.emit("room_change", getPublicRooms());
  });

  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
  });

  socket.on("nickname", (nickname) => {
    socket["nickname"] = nickname;
  });
});

server.listen(3000, handleListen);
```

### Client

```javascript
const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName;

const addMassage = (message) => {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
};

const handleMessageSubmit = (e) => {
  e.preventDefault();
  const input = room.querySelector("#msg input");
  const value = input.value;
  socket.emit("new_message", value, roomName, () => {
    addMassage(`You : ${value}`);
  });
  input.value = "";
};

const handleNicknameSave = () => {
  const input = form.querySelector("#nickname");
  const value = input.value;
  socket.emit("nickname", value);
};

const showRoom = () => {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName}`;

  const msgForm = room.querySelector("#msg");
  msgForm.addEventListener("submit", handleMessageSubmit);
};

const handleRoomSubmit = (e) => {
  e.preventDefault();
  const input = form.querySelector("#roomName");
  handleNicknameSave();
  socket.emit("enter_room", input.value, showRoom);
  roomName = input.value;
  input.value = "";
};
form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMassage(`${user} joined!`);
});

socket.on("bye", (user, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMassage(`${user} left...`);
});

socket.on("new_message", addMassage);

// socket.on("room_change",msg=>console.log(msg)) 와 동일
socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
  if (rooms.length === 0) {
    roomList.innerHTML = "";
    return;
  }

  roomList.innerHTML = "";
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li);
  });
});
```

### pug template

```pug

doctype html
html(lang="en")
    head
        meta(charset="UTF-8")
        meta(name="viewport", content="width=device-width, initial-scale=1.0")
        title ZAAM
        link(rel="stylesheet",href="https://unpkg.com/mvp.css")
    body
        header
            h1 ZAAM
        main
            div#welcome
                form
                    input#roomName(placeholder="room name", required, type="text")
                    input#nickname(placeholder="nickname", required, type="text")
                    button Enter Room
                h4 Open Rooms:
                ul
            div#room
                h3
                ul
                form#msg
                    input(placeholder="message", required, type="text")
                    button Send
        script(src="/socket.io/socket.io.js")
        script(src="/public/js/app.js")

```

- socket.on 을 통해 처리할 로직을 등록하고, socket.emit을 통해 사용하고자 하는 곳에서 적절한 인자를 넣어 실행시킨다.
- 이때 등록한 로직과 사용할 로직의 이벤트 이름은 무조건 같아야 한다.
- ex) socket.on("eventName", ...) <-> socket.emit("eventName", ...)
- 이벤트의 등록과 실행은 프론트와 백 구분 없이 on과 emit이 가능하다.

### on/emit 예제

```javascript
// BE
io.on("connection", (socket) => {
  socket.on("enter_room", (msg, done, ~~) => {
    console.log(msg);
    setTimeout(() => {
      done();
    }, 5000);
  });
});
// FB
const handleRoomSubmit = (e) => {
    e.preventDefault();
    const input = form.querySelector("input");
    socket.emit("enter_room", { payload: input.value }, () => {
      console.log("server is done");
    }, ~~~~ );
    input.value = "";
  };
  form.addEventListener("submit", handleRoomSubmit);
```

## Socket.io admin panel

### Server

```javascript
import http from "http";
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

const server = http.createServer(app);

// admin panel ///////////
const io = new Server(server, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});
instrument(io, {
  auth: false,
});
/////////////////////

io.on("connection", (socket) => {
  // socket logic ~~
});

server.listen(3000, handleListen);
```

## ws 모듈의 WebSocket이 있지만 Socket.io를 사용하는 이유

- ws를 사용하는 경우 스트링에 한정된 소통 방식때문에 번거로운 parsing이 반복될 수 있다.
- Socket.io는 WebSocket 연결이 끊어져도 http polling을 통해 다른 방식으로 연결을 지속시키는 시도를 하거나, 다양한 데이터 형식을 사용할 수 있는 등 ws의 역할에 국한되지 않는 다양한 기능들을 제공해주기 때문에 우리의 양방향 통신 개발을 원활하게 해주기 때문에 다양한 개발 경험을 쌓을 수 있다고 생각한다.

### ws 모듈 server logic

```javascript
import http from "http";
import WebSocket from "ws";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on http://localhost:3000");

const server = http.createServer(app);

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
```
