const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");

const backendDone = (msg) => {
  console.log(`backend sad : ${msg}`);
};

const handleRoomSubmit = (e) => {
  e.preventDefault();
  const input = form.querySelector("input");
  socket.emit("enter_room", { payload: input.value }, backendDone);
  input.value = "";
};
form.addEventListener("submit", handleRoomSubmit);
