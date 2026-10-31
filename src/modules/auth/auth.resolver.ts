import type { IGraphQlContext } from "../../graphql/graphql.types.js";
import { loginUser, refreshUserToken, registerUser } from "./auth.service.js";

export const userResolver = {
  User: {
    id: (user: any) => user._id.toString(),
  },
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

export const authResolvers = {
  Mutation: {
    register: async (
      _parent: unknown,
      args: {
        input: {
          name: string;
          email: string;
          password: string;
          role?: "CUSTOMER" | "ORGANIZER";
        };
      },
    ) => {
      return registerUser(args.input);
    },

    login: async (
      _parent: unknown,
      args: {
        input: {
          email: string;
          password: string;
        };
      },
      context: IGraphQlContext,
    ) => {
      const { accessToken, refreshToken, user } = await loginUser(args.input);

      context.res.cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return { accessToken, user };
    },

    refreshToken: async (
      _parent: unknown,
      _args: unknown,
      context: IGraphQlContext,
    ) => {
      const token = context.req.cookies?.refreshToken;

      if (!token) {
        throw new Error("Refresh token not found");
      }

      return refreshUserToken(token);
    },

    logout: (_parent: unknown, _args: unknown, context: IGraphQlContext) => {
      context.res.clearCookie("refreshToken", cookieOptions);
      return true;
    },
  },
};
