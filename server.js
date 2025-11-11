/**
 * Custom Next.js server with WebSocket support
 * This server runs both the Next.js app and a WebSocket server
 */

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  // Initialize WebSocket server
  if (process.env.ENABLE_WEBSOCKET !== "false") {
    try {
      const io = new Server(httpServer, {
        cors: {
          origin: dev
            ? ["http://localhost:3000", "http://localhost:3001"]
            : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          credentials: true,
        },
        transports: ["websocket", "polling"],
      });

      // Connection handler
      io.on("connection", (socket) => {
        console.log(`Client connected: ${socket.id}`);

        // Initialize socket data
        socket.data.rooms = [];

        // Join room handler
        socket.on("join:room", (room) => {
          socket.join(room);
          socket.data.rooms = socket.data.rooms || [];
          socket.data.rooms.push(room);
          console.log(`Socket ${socket.id} joined room: ${room}`);
        });

        // Leave room handler
        socket.on("leave:room", (room) => {
          socket.leave(room);
          socket.data.rooms = (socket.data.rooms || []).filter((r) => r !== room);
          console.log(`Socket ${socket.id} left room: ${room}`);
        });

        // Ping handler
        socket.on("ping", (callback) => {
          if (typeof callback === "function") {
            callback("pong");
          }
        });

        // Disconnect handler
        socket.on("disconnect", (reason) => {
          console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
        });

        // Error handler
        socket.on("error", (error) => {
          console.error(`Socket error for ${socket.id}:`, error);
        });
      });

      // Store io instance globally for API routes to access
      global.io = io;

      console.log("✓ WebSocket server initialized");
    } catch (error) {
      console.error("✗ Failed to initialize WebSocket server:", error);
      console.log("Continuing without WebSocket support...");
    }
  } else {
    console.log("WebSocket disabled via ENABLE_WEBSOCKET=false");
  }

  // Start the server
  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Environment: ${dev ? "development" : "production"}`);
    console.log(`> WebSocket: ${process.env.ENABLE_WEBSOCKET !== "false" ? "enabled" : "disabled"}`);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
    httpServer.close(() => {
      console.log("HTTP server closed");
    });
  });

  process.on("SIGINT", () => {
    console.log("SIGINT signal received: closing HTTP server");
    httpServer.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  });
});
