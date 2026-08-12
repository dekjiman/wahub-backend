import { Request } from 'express';

export interface PaginationParams {
  page: number;
  perPage: number;
  offset: number;
}

export const getPaginationParams = (req: Request): PaginationParams => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const perPage = Math.min(
    100,
    Math.max(1, parseInt(req.query.per_page as string, 10) || 20)
  );
  const offset = (page - 1) * perPage;

  return { page, perPage, offset };
};
