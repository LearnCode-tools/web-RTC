const msgList = document.querySelector("ul");
const nickFrom = document.querySelector("#nick");
const msgForm = document.querySelector("#message");

const socket = new WebSocket(`ws://${window.location.host}`);

const makeMsg = (type, payload) => {
  const msg = { type, payload };
  return JSON.stringify(msg);
};

socket.addEventListener("open", () => {
  console.log("Connected to Server ✅");
});

socket.addEventListener("message", (message) => {
  const li = document.createElement("li");
  li.innerText = message.data;
  msgList.append(li);
});

socket.addEventListener("close", () => {
  console.log("Disconnected from Server ❌");
});

const handleSubmit = (e) => {
  e.preventDefault();
  const input = msgForm.querySelector("input");
  socket.send(makeMsg("new MSG", input.value));
  const li = document.createElement("li");
  li.innerText = `YOU: ${input.value}`;
  msgList.append(li);
  input.value = "";
};

const handleNickSubmit = (e) => {
  e.preventDefault();
  const input = nickFrom.querySelector("input");
  socket.send(makeMsg("nickname", input.value));
  input.value = "";
};
msgForm.addEventListener("submit", handleSubmit);
nickFrom.addEventListener("submit", handleNickSubmit);
