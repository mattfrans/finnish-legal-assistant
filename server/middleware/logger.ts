import { Request, Response, NextFunction } from 'express';

export function apiLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, originalUrl } = req;

  // Log request
  console.log(`${new Date().toISOString()} [API] ${method} ${originalUrl}`);

  // Capture response
  const oldJson = res.json;
  res.json = function(body) {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} [API] ${method} ${originalUrl} ${res.statusCode} ${duration}ms`);
    return oldJson.call(this, body);
  };

  next();
}
