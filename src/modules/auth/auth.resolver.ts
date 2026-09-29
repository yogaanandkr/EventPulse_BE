import type { IGraphQlContext } from "../../graphql/graphql.types.js";
import { loginUser, registerUser } from "./auth.service.js";

export const userResolver = {
  User: {
    id: (user: any) => user._id.toString(),
  },
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
      return await registerUser(args.input);
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
      console.log("user got: ", user);
      context.res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV == "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return { accessToken, user };
    },
  },
};
