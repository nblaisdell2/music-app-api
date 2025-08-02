import { exec, query } from "../db";
import type { FastifyInstance } from "fastify";

export type User = {
  id: number;
  username: string;
};

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get("/", (request, reply) => {
    return { hello: "goodbye" };
  });

  fastify.post<{ Body: { username: string }; Reply: User[] }>(
    "/new_user",
    async (req, reply) => {
      const { rows } = await exec<User>(
        fastify,
        "add_new_user",
        req.body.username
      );
      return reply.send(rows);
    }
  );

  fastify.get<{
    Params: { id: number };
    Reply: User[];
  }>("/user/:id", async (req, reply) => {
    const { rows } = await query<User>(
      fastify,
      "get_user_by_id",
      req.params.id
    );
    return reply.send(rows);
  });
}
