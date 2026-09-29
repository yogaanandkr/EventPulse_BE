import type { Request, Response } from "express";
import { type IAccessTokenPayload } from "../utils/jwt.js";

export interface IGraphQlContext {
  req: Request;
  res: Response;
  user: IAccessTokenPayload | any;
}

