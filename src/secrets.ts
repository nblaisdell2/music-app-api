import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" }); // change to your region

export async function getSecrets(secretName: string) {
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await client.send(command);

    if (response["SecretString"]) {
      return JSON.parse(response.SecretString);
    } else {
      const buff = Buffer.from(response.SecretBinary!.toString(), "base64");
      return JSON.parse(buff.toString("ascii"));
    }
  } catch (err) {
    console.error("Failed to fetch secrets:", err);
    // throw err;
  }
}
