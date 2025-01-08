import server from "./server";
import io from "./socket_server";

const port = process.env.PORT || 5000;

// חיבור ה-WebSocket לשרת
io(server);

// הפעלת השרת
server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

export default server;
