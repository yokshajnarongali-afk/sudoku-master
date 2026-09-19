import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:3001";
const CONCURRENT_CLIENTS = 100;
let connectedCount = 0;

console.log(`Starting load test with ${CONCURRENT_CLIENTS} clients...`);

for (let i = 0; i < CONCURRENT_CLIENTS; i++) {
  const socket = io(SERVER_URL, { transports: ["websocket"] });

  socket.on("connect", () => {
    connectedCount++;
    if (connectedCount === CONCURRENT_CLIENTS) {
      console.log(`✅ All ${CONCURRENT_CLIENTS} clients connected successfully.`);
      
      // Simulate creating rooms
      console.log("Simulating room creations...");
      for (let j = 0; j < 10; j++) {
        socket.emit("room:create", {
          difficulty: "easy",
          gameMode: "competitive",
          isPrivate: false,
        }, (res) => {
          if (res.ok) {
            console.log(`Room created: ${res.data.code}`);
          }
        });
      }

      setTimeout(() => {
        console.log("Load test complete. Disconnecting.");
        process.exit(0);
      }, 3000);
    }
  });

  socket.on("connect_error", (err) => {
    console.error(`Connection failed for client ${i}:`, err.message);
  });
}
