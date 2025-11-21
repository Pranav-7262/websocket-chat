//here we set up the websocket connection

import { io } from "socket.io-client"; //importing socket.io-client
const SOCKET_URL = "http://localhost:3000"; //server url
export const ConnectWS = io(SOCKET_URL); //creating socket connection
//exporting the socket for use in other parts of the frontend application
