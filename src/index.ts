// import awsLambdaFastify from "@fastify/aws-lambda";
// import init from "./app";

// const proxy = awsLambdaFastify(init());
// // or
// // const proxy = awsLambdaFastify(init(), { binaryMimeTypes: ['application/octet-stream'] })

// exports.handler = proxy;

import awsLambdaFastify from "@fastify/aws-lambda";
import init from "./app";
import { getSecrets } from "./secrets";

exports.handler = async (event: any, context: any) => {
  const secrets = await getSecrets(process.env.SECRET_ID!);
  for (const [key, val] of Object.entries(secrets)) {
    process.env[key] = val as string;
  }

  const app = await init();
  const proxy = awsLambdaFastify(app);

  return proxy(event, context);
};
