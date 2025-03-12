import http from "http";
import "./config/firebaseConfig";
import "./passport";
declare const app: import("express-serve-static-core").Express;
declare const server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
export { server, app };
