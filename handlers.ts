import { Context } from "https://deno.land/x/oak/mod.ts";
import TTL from "https://deno.land/x/ttl/mod.ts";

const ttl = new TTL();

const pangeaDomain = Deno.env.get("PANGEA_DOMAIN");
const pangeaToken = Deno.env.get("PANGEA_TOKEN");

export function frontend(ctx: Context) {
  ctx.response.body =
    `A wrapper for Pangea's Embargo Service. Send a POST request to /embargo with JSON body {"countryCode": "<countryCode>"} to check that countries embargo status.`;
}

interface EmbargoRequest {
  countryCode: string;
}

export async function checkEmbargoStatus(ctx: Context) {
  if (!ctx.request.hasBody) {
    ctx.throw(400);
  }

  const reqBody: EmbargoRequest = await ctx.request.body().value;
  const countryCode = reqBody.countryCode;
  if (!countryCode) {
    ctx.throw(400);
  }

  const cachedResult = ttl.get(countryCode);
  if (cachedResult) {
    ctx.response.body = cachedResult;
    return;
  }

  const body = `{"iso_code": "${countryCode}"}`;

  const resp = await fetch(`https://embargo.${pangeaDomain}/v1/iso/check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${pangeaToken}`,
    },
    body,
  });

  const jsonData = await resp.json();
  const result = jsonData.result;
  if (!result) {
    console.log("error calling pangea:", jsonData);
    ctx.throw(500);
  }

  ttl.set(countryCode, result, 86400); // cache for one day

  ctx.response.body = result;
}
