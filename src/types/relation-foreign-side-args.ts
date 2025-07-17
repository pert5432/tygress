import { AnEntity } from "./entity";
import { ReferentialAction } from "./structure";

export type RelationForeignSideArgs<Primary extends AnEntity> = {
  primaryKey?: keyof InstanceType<Primary>;

  onUpdate?: ReferentialAction;
  onDelete?: ReferentialAction;

  generateForeignKey?: boolean;
};
