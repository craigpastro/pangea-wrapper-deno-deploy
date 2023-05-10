import { Application, Context, Router } from "https://deno.land/x/oak/mod.ts";
import TTL from "https://deno.land/x/ttl/mod.ts";

const pangeaDomain = Deno.env.get("PANGEA_DOMAIN");
const pangeaToken = Deno.env.get("PANGEA_TOKEN");

const port = 8080;

const ttl = new TTL();

const router = new Router();

router.get("/", (ctx) => {
  ctx.response.body =
    `Pangea's Embargo Service. Send a POST request to /embargo with JSON body {"countryCode": "<countryCode>"} to check that countries embargo status.`;
});

router.post("/embargo", checkEmbargoStatus);

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

console.log(`listening on http://localhost:${port}`);

await app.listen({ port });

async function checkEmbargoStatus(ctx: Context) {
  if (!ctx.request.hasBody) {
    ctx.throw(400);
  }

  const reqBody = await ctx.request.body().value;
  const countryCode = reqBody.countryCode;

  const cachedResult = ttl.get(countryCode);
  if (cachedResult) {
    ctx.response.body = cachedResult;
    return;
  }

  const body = `{"iso_code": "${reqBody.countryCode}"}`;

  let resp = await fetch(`https://embargo.${pangeaDomain}/v1/iso/check`, {
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
    ctx.throw(500);
  }

  ttl.set(countryCode, result, 86400); // cache for one day

  ctx.response.body = jsonData.result;
}
