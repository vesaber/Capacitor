FROM oven/bun:latest

WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ fonts-inter fontconfig && fc-cache -f && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

CMD ["bun", "run", "index.ts"]
