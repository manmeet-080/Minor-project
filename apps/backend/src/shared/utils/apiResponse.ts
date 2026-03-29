import { Response } from 'express';

export function success<T>(res: Response, data: T, message = 'Success', statusCode = 200, meta?: object) {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta && { meta }),
  });
}

export function error(res: Response, message: string, statusCode = 400) {
  res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
}
