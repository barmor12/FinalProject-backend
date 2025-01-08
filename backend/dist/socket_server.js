"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const setupSocketServer = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });
    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id);
        socket.on("message", (data) => {
            console.log("Message received:", data);
            socket.broadcast.emit("message", data);
        });
        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });
    return io;
};
exports.default = setupSocketServer;
//# sourceMappingURL=socket_server.js.map