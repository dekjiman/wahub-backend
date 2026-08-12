import { Response } from 'express';

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
}

export class ApiResponse {
  static success<T>(res: Response, data: T, statusCode = 200) {
    return res.status(statusCode).json({ data });
  }

  static successWithMeta<T>(
    res: Response,
    data: T[],
    meta: PaginationMeta,
    statusCode = 200
  ) {
    return res.status(statusCode).json({ data, meta });
  }

  static error(
    res: Response,
    errors: ApiError[] | ApiError,
    statusCode = 400
  ) {
    const errorArray = Array.isArray(errors) ? errors : [errors];
    return res.status(statusCode).json({ errors: errorArray });
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }
}
