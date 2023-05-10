import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

function handler(_req: Request) {
  const data = {
    data: "Hello, World!",
  };

  const body = JSON.stringify(data, null, 2);
  
  return new Response(body, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

serve(handler);
