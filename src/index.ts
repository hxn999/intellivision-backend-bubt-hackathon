import "dotenv/config";
import http from "http";
import app from "./app";
import { connectDatabase } from "./config/database";

// Starting port: from environment if provided, otherwise 3000
const BASE_PORT = Number(process.env.PORT) || 3000;

const startServer = (port: number) => {
  const server = http.createServer(app);

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running on http://localhost:${port}`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      const nextPort = port + 1;
      // eslint-disable-next-line no-console
      console.warn(
        `Port ${port} is already in use, trying port ${nextPort} instead...`
      );
      startServer(nextPort);
    } else {
      throw err;
    }
  });
};

const bootstrap = async () => {
  try {
    await connectDatabase();
    startServer(BASE_PORT);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start application:", error);
    process.exit(1);
  }
};

void bootstrap();
