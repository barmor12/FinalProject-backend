import { Server } from "socket.io";
import { Server as HttpServer } from "http";
declare const setupSocketServer: (server: HttpServer) => Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export default setupSocketServer;
