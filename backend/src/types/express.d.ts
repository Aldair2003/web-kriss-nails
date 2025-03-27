import { Request as ExpressRequest, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

declare module 'express' {
  interface Request extends ExpressRequest {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

export type AsyncRequestHandler<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next?: NextFunction,
) => Promise<any> | any; 