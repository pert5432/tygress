import { Relation } from "../../enums/";
import { Entity } from "../entity";

export type RelationMetadataArgs = {
  type: Relation;

  foreign: Entity<unknown>;
  foreignField: string;
  foreignKey?: string;

  primary: Entity<unknown>;
  primaryField: string;
  primaryKey?: string;
};
