"use strict";

var express = require("express");
var http = require("http");
var WebSocket = require("ws");

var app = express();

// اگر خواستی فایل‌ها رو هم سرو کنی
app.use(express.static(__dirname));

var server = http.createServer(app);
var websocketServer = new WebSocket.Server({ server });

websocketServer.on("connection", (ws) => {
    ws.on("message", (message) => {
        websocketServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && client !== ws) {
                client.send(message.toString());
            }
        });
    });
});

server.listen(8080, "0.0.0.0", () => {
    console.log("LAN WebSocket server running on port 8080");
});
