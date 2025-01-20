import { server } from "./server";
import io from "./socket_server"; // מניח שיצרת מודול WebSocket

const port = process.env.PORT || 3000;

// חיבור WebSocket לשרת HTTP
io(server);

// הפעלת השרת
server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
