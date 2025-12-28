declare module "next-ws/server" {
  import type { NextConfig } from "next";

  export default function withNextWs(config: NextConfig): NextConfig;

  export type RouteContext<Path extends string> = {
    params: Record<string, string | string[]>;
    pathname: Path;
  };
}

