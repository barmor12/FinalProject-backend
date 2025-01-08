import http from "http";
import "./passport";
declare const server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
export default server;
