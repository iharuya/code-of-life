FROM denoland/deno:latest

WORKDIR /app

COPY deno.json .
COPY index.ts .
RUN deno cache index.ts
