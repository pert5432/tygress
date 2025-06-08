import { Relation } from "../../enums/";
import { AnEntity } from "../entity";

export type RelationMetadataArgs = {
  type: Relation;

  foreign: () => AnEntity;
  foreignField: string;
  foreignKey?: string;

  primary: () => AnEntity;
  primaryField: string;
  primaryKey?: string;
};
