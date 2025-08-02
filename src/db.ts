import db from "@fastify/postgres";
import { FastifyInstance } from "fastify";
import { QueryResultRow } from "pg";

export function getConnection(fastify: FastifyInstance, isLocal: boolean) {
  if (isLocal) {
    return {
      host: process.env.DB_HOST as string,
      database: process.env.DB_DATABASE as string,
      port: process.env.DB_PORT as unknown as number,
      user: process.env.DB_USER as string,
      password: process.env.DB_PASS as string,
    };
  } else {
    return {
      host: process.env.DB_HOST as string,
      database: process.env.DB_DATABASE as string,
      port: process.env.DB_PORT as unknown as number,
      user: process.env.DB_USER as string,
      password: process.env.DB_PASS as string,
      // TODO: Figure out SSL issues for Production
      //       https://stackoverflow.com/questions/76899023/rds-while-connection-error-no-pg-hba-conf-entry-for-host
      ssl: {
        rejectUnauthorized: false,
      },
    };
  }
}

function getFunctionSQL(
  functionName: string,
  ...params: any[]
): { sql: string; params: any[] } {
  const paramList = [...Array(params.length).keys()]
    .map((v) => "$" + (v + 1))
    .join(", ");

  return { sql: `SELECT * FROM ${functionName}(${paramList});`, params };
}

function getProcedureSQL(
  procedureName: string,
  ...params: any[]
): { sql: string; params: any[] } {
  const paramList = [...Array(params.length).keys()]
    .map((v) => "$" + (v + 1))
    .join(", ");
  return { sql: `CALL ${procedureName}(${paramList});`, params };
}

export async function query<TResult extends QueryResultRow>(
  fastify: FastifyInstance,
  functionName: string,
  ...functionParams: any[]
) {
  const { sql, params } = getFunctionSQL(functionName, ...functionParams);
  const result = await fastify.pg.query<TResult>(sql, params);
  return result;
}

export async function exec<TResult extends QueryResultRow>(
  fastify: FastifyInstance,
  procName: string,
  ...procParams: any[]
) {
  const { sql, params } = getProcedureSQL(procName, ...procParams);
  const result = await fastify.pg.query<TResult>(sql, params);
  return result;
}

export default db;
