import "dotenv/config";
import { AzureKeyCredential } from "@azure/core-auth";
import { LanguagesClientConvenience } from "@azure-tools/cadl-ts-sample-client";

async function demo() {
  const endpoint = process.env["ENDPOINT"] ?? "";
  const apiKey = process.env["API_KEY"] ?? "";
  /*
  const options = {
    additionalPolicies: [
      {
        policy: {
          name: "debug",
          async sendRequest(req, next) {
            console.log(req.body);
            return next(req);
          },
        },
        position: "perRetry",
      },
    ],
  };
  */
  const client = new LanguagesClientConvenience(endpoint, new AzureKeyCredential(apiKey));
  const results = await client.detect({
    documents: [{ id: "1", text: "hello this is English!" }],
  });
  console.log(JSON.stringify(results, undefined, 2));
}

demo().catch((e) => console.error("Error!", e));
