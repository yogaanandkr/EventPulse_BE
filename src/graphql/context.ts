import { verifyAccessToken } from "../utils/jwt.js";
import type { IGraphQlContext } from "./graphql.types.js";

export const createContext = ({
  req,
  res,
}: Pick<IGraphQlContext, "req" | "res">): IGraphQlContext => {
  const authHeader = req.headers.authorization;
  const nullUser = {
    req,
    res,
    user: null,
  };
  if (!authHeader) {
    return nullUser;
  }
  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) {
    return {
      req,
      res,
      user: null,
    };
  }

  try {
    const user = verifyAccessToken(token);
    return {
      req,
      res,
      user,
    };
  } catch (error) {
    return nullUser;
  }
};
