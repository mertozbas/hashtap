import type { FastifyServerOptions } from 'fastify';

export const loggerConfig: FastifyServerOptions['logger'] = {
  level: process.env.LOG_LEVEL ?? 'info',
  redact: ['req.headers.authorization', 'req.headers.cookie'],
};
