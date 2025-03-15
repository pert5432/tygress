import { PoolClient } from "pg";

export class ConnectionWrapper {
  constructor(public client: PoolClient) {}
}
