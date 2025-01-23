"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const socket_server_1 = __importDefault(require("./socket_server"));
const port = process.env.PORT || 3000;
(0, socket_server_1.default)(server_1.server);
server_1.server.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
//# sourceMappingURL=app.js.map