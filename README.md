# pangea-embargo-deno-deploy

Playing with [Deno Deploy](https://deno.com/deploy).

## Usage

Run the server with

```console
deno run --allow-net server.ts
```

and send a request with

```console
curl -XPOST 'http://localhost:8080/embargo' \
    -H 'Content-Type: application/json' \
    -d '{
        "countryCode": "CD"
    }'
```
