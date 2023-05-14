import { Context, send } from "https://deno.land/x/oak/mod.ts";
import TTL from "https://deno.land/x/ttl/mod.ts";
import { isIPv4 } from "https://raw.githubusercontent.com/ako-deno/isIP/master/mod.ts";

const ttl = new TTL();

const pangeaDomain = Deno.env.get("PANGEA_DOMAIN");
const pangeaToken = Deno.env.get("PANGEA_TOKEN");

export async function servePublic(ctx: Context) {
  await send(ctx, ctx.request.url.pathname, {
    root: "./public",
    index: "index.html",
  });
}

export async function checkEmbargoStatus(ctx: Context) {
  const countryCode = ctx.request.url.searchParams.get("countryCode");
  if (!countryCode) {
    ctx.throw(400, "please set the countryCode query parameter");
  }

  const cacheKey = `embargo-${countryCode}`;
  const cachedResult = ttl.get(cacheKey);
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
    ctx.throw(500, "error calling pangea");
  }

  ttl.set(cacheKey, result, 86400); // cache for one day

  ctx.response.body = result;
}

export async function checkVpnStatus(ctx: Context) {
  let ip = ctx.request.url.searchParams.get("ip");
  if (!ip) {
    ip = ctx.request.ip;
  }

  if (!isIPv4(ip)) {
    ctx.throw(400, `isVpn only works with IPv4 addresses: ip=${ip}`);
  }

  const cacheKey = `isVpn-${ip}`;
  const cachedResult = ttl.get(cacheKey);
  if (cachedResult) {
    ctx.response.body = cachedResult;
    return;
  }

  const body = `{"provider":"digitalelement", "ip":"${ip}"}`;
  const resp = await fetch(`https://ip-intel.${pangeaDomain}/v1/vpn`, {
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
    ctx.throw(500, "error calling pangea");
  }

  const respBody = { ip, isVpn: result.data.is_vpn };
  ttl.set(cacheKey, respBody, 43200); // cache for half a day

  ctx.response.body = respBody;
}
