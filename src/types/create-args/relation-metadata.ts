import { Relation } from "../../enums/";
import { AnEntity } from "../entity";
import { ReferentialAction } from "../structure";

export type RelationMetadataArgs = {
  type: Relation;

  foreign: () => AnEntity;
  foreignField: string;
  foreignKey?: string;

  primary: () => AnEntity;
  primaryField: string;
  primaryKey?: string;

  onUpdate?: ReferentialAction;
  onDelete?: ReferentialAction;
};
