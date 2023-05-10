# pangea-embargo-deno-deploy

Playing with [Deno Deploy](https://deno.com/deploy).

## Usage

### Locally

Run the server with

```console
make run
```

and send a request with

```console
curl -XPOST 'http://localhost:8080/embargo' \
    -H 'Content-Type: application/json' \
    -d '{
        "countryCode": "CD"
    }'
```

### From Deno Deploy

```console
curl -XPOST 'https://pangea-embargo.deno.dev/embargo' \
    -H 'Content-Type: application/json' \
    -d '{
        "countryCode": "CD"
    }'
```
