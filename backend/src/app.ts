import { server } from "./server";
import io from "./socket_server"; // מניח שיצרת מודול WebSocket

const port = process.env.PORT || 3000;

// חיבור WebSocket לשרת HTTP
io(server);
console.log("CI/CD working test");
// הפעלת השרת
server.listen(Number(port), "0.0.0.0", () => {
  console.log(`Server is running on port: ${port}`);
});
export default server;
