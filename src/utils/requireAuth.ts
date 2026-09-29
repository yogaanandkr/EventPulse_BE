import type { IGraphQlContext } from "../graphql/graphql.types.js";

export const requireAuth = (context: IGraphQlContext) => {
  if (!context.user) {
    throw new Error("Authentication required");
  }

  return context.user;
};
