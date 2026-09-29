import type { IGraphQlContext } from "../graphql/graphql.types.js";
import type { UserRole } from "./jwt.js";
import { requireAuth } from "./requireAuth.js";

export const requireRole = (
  context: IGraphQlContext,
  allowedRoles: UserRole[],
) => {
  const user = requireAuth(context);

  if (!allowedRoles.includes(user.role)) {
    throw new Error("You are not authorized to perform this action");
  }

  return user;
};
