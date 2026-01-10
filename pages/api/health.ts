import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../src/lib/prisma";

interface HealthCheckResponse {
  status: "ok" | "error";
  timestamp: string;
  uptime: number;
  database: {
    status: "connected" | "disconnected";
    responseTime?: number;
  };
  environment: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheckResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: "error",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: { status: "disconnected" },
      environment: process.env.NODE_ENV || "unknown",
    });
  }

  const startTime = Date.now();
  let dbStatus: "connected" | "disconnected" = "disconnected";
  let responseTime: number | undefined;

  try {
    // Проверка подключения к базе данных
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
    responseTime = Date.now() - startTime;
  } catch (error) {
    dbStatus = "disconnected";
    responseTime = Date.now() - startTime;
  }

  const healthStatus: HealthCheckResponse = {
    status: dbStatus === "connected" ? "ok" : "error",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: dbStatus,
      responseTime,
    },
    environment: process.env.NODE_ENV || "unknown",
  };

  const statusCode = healthStatus.status === "ok" ? 200 : 503;
  return res.status(statusCode).json(healthStatus);
}
