import { Application, Context, Router } from "https://deno.land/x/oak/mod.ts";
import TTL from "https://deno.land/x/ttl/mod.ts";

const pangeaDomain = Deno.env.get("PANGEA_DOMAIN");
const pangeaToken = Deno.env.get("PANGEA_TOKEN");

const denoRegion = Deno.env.get("DENO_REGION");

const port = 8080;
const responseTimeHeader = "Response-Time";

const ttl = new TTL();

const router = new Router();

router.get("/", (ctx) => {
  ctx.response.body =
    `Pangea's Embargo Service. Send a POST request to /embargo with JSON body {"countryCode": "<countryCode>"} to check that countries embargo status.`;
});

router.post("/embargo", checkEmbargoStatus);

const app = new Application();

app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.headers.get(responseTimeHeader);
  console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
});

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set(responseTimeHeader, `${ms}ms`);
});

app.use(router.routes());
app.use(router.allowedMethods());

if (denoRegion) {
  console.log(`🚀 serving request from ${denoRegion}`);
} else {
  console.log(`🚀 serving request on localhost:${port}`);
}

await app.listen({ port });

async function checkEmbargoStatus(ctx: Context) {
  if (!ctx.request.hasBody) {
    ctx.throw(400);
  }

  const reqBody = await ctx.request.body().value;
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
