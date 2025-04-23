import {
  ColumnIdentifierSqlBuilderFactory,
  SelectTargetSqlBuilderFactory,
  TargetNodeFactory,
} from "../factories";
import { METADATA_STORE, TableMetadata } from "../metadata";
import { SelectQueryArgs, AnEntity } from "../types";
import { TargetNode, Query } from "../types/query";
import { JoinArg } from "../types/query/join-arg";
import { ParamBuilder } from "./param-builder";
import {
  ColumnSelectTargetSqlBuilder,
  SelectTargetSqlBuilder,
} from "./select-target";
import { QueryResultType } from "../enums";

// TODO: get rid of the useless generic arg
export class SelectSqlBuilder<T extends AnEntity> {
  constructor(
    private args: SelectQueryArgs,
    private paramBuilder: ParamBuilder
  ) {
    this.rootJoinArg = args.joins[0]! as JoinArg;

    // Only create target nodes when selecting entities as their are useless otherwise
    if (this.rootJoinArg.childType === "entity") {
      const rootTargetNode = TargetNodeFactory.createRoot(
        this.rootJoinArg.klass,
        this.rootJoinArg.alias
      );

      this.targetNodes = rootTargetNode as TargetNode<T>;
      this.targetNodesByAlias.set(this.rootJoinArg.alias, rootTargetNode);
    }
  }

  private rootJoinArg: JoinArg;
  private whereConditions: string[] = [];
  private sqlJoins: string[] = [];

  private selectTargetSqlBuilders: SelectTargetSqlBuilder[] = [];

  private targetNodes?: TargetNode<T>;
  private targetNodesByAlias = new Map<string, TargetNode<AnEntity>>();

  public buildSelect(): Query {
    if (this.args.distinct && this.args.distinctOn?.length) {
      throw new Error(`Can't use DISTINCT and DISTINCT ON in one query`);
    }

    this.buildJoins();
    this.buildWhereConditions();
    this.selectDesiredFields();

    //
    // Build the actual SQL
    //

    let sql = ``;

    if (this.args.with?.length) {
      sql += `WITH ${this.args.with
        .map((e) => e.sql(this.paramBuilder))
        .join(", ")} `;
    }

    sql += `SELECT `;

    if (this.args.distinct) {
      sql += `DISTINCT `;
    } else if (this.args.distinctOn?.length) {
      sql += `DISTINCT ON (${this.args.distinctOn
        .map((e) => e.sql())
        .join(", ")}) `;
    }

    sql += `${this.selectTargetSqlBuilders
      .map((e) => e.sql(this.paramBuilder))
      .join(", ")}`;

    sql += ` FROM ${this.rootJoinArg.identifier.sql(this.paramBuilder)}`;

    if (this.sqlJoins.length) {
      sql += ` ${this.sqlJoins.join(" ")}`;
    }

    if (this.whereConditions.length) {
      sql += ` WHERE ${this.whereConditions.join(" AND ")}`;
    }

    if (this.args.groupBys?.length) {
      sql += ` GROUP BY ${this.args.groupBys.map((e) => e.sql()).join(", ")}`;
    }

    if (this.args.orderBys?.length) {
      sql += ` ORDER BY ${this.args.orderBys.map((e) => e.sql()).join(", ")}`;
    }

    if (this.args.limit) {
      if (this.args.limit < 1) {
        throw new Error(`Bogus limit ${this.args.limit}`);
      }

      sql += ` LIMIT ${this.args.limit}`;
    }

    if (this.args.offset) {
      if (this.args.offset < 0) {
        throw new Error(`Bogus offset ${this.args.offset}`);
      }

      sql += ` OFFSET ${this.args.offset}`;
    }

    return {
      sql,
      params: this.paramBuilder.params,
      joinNodes: this.targetNodes,
    };
  }

  private buildWhereConditions(): void {
    if (!this.args.wheres) {
      return;
    }

    for (const comparison of this.args.wheres) {
      this.whereConditions.push(comparison.sql(this.paramBuilder));
    }
  }

  private buildJoins(): void {
    if (!this.args?.joins) {
      return;
    }

    // Skip first node since its the root
    for (const join of this.args.joins.slice(1)) {
      this.sqlJoins.push(join.sql(this.paramBuilder));

      // Don't need to build target nodes if we aren't planning on returning entities
      if (!this.returningEntities()) {
        continue;
      }

      let nextTargetNode: TargetNode<AnEntity>;

      if (join.childType === "cte") {
        nextTargetNode = TargetNodeFactory.createCTE(join.alias);
      } else if (join.parentAlias) {
        const parentTargetNode = this.targetNodesByAlias.get(join.parentAlias)!;

        nextTargetNode = TargetNodeFactory.create(
          join.alias,
          parentTargetNode,
          join.klass,
          join.parentField!,
          join.select
        );

        parentTargetNode.joins[join.parentField!] = nextTargetNode;
      } else {
        nextTargetNode = TargetNodeFactory.createRoot(
          join.klass,
          join.alias,
          join.select
        );
      }

      this.targetNodesByAlias.set(join.alias, nextTargetNode);
    }
  }

  //
  // SELECTING AND TRACKING FIELDS
  //

  // Either select exactly the fields the user wants selected
  // Or select all by-default-selectable fields from all nodes the user wants
  //
  // Ensure primary keys are selected for the nodes that require it
  //
  // Register selected fields that are supposed to be mapped into entity fields in target nodes
  private selectDesiredFields(): void {
    // Set which fields should be selected and track them in target nodes
    if (this.args.selects?.length) {
      this.registerSelectedFieldsToNodes(this.args.selects);
    } else {
      this.selectFieldsFromJoinNode(this.targetNodes);
    }

    // Make sure to select primary keys
    // Important to call this after registering selected fields into target nodes
    this.ensurePrimaryKeySelection(this.targetNodes);
  }

  // Select all fields that are selectable by default on all join nodes
  // TODO: decide whether this should even be the responsibility of this class
  private selectFieldsFromJoinNode = <E extends AnEntity>(
    node?: TargetNode<E>
  ): void => {
    if (!node) {
      return;
    }

    if (node.select) {
      for (const column of METADATA_STORE.getTable(node.klass)
        .columnsSelectableByDefault) {
        const selectTarget = `${node.alias}.${column.fieldName}`;

        // Select the colum
        this.selectTargetSqlBuilders.push(
          SelectTargetSqlBuilderFactory.createColumnIdentifier(
            ColumnIdentifierSqlBuilderFactory.createColumnMeta(
              node.alias,
              column
            ),
            selectTarget
          )
        );

        // Register the column as selected on the node
        node.selectField(column.fieldName, selectTarget);
      }
    }

    for (const key in node.joins) {
      this.selectFieldsFromJoinNode(node.joins[key]!);
    }
  };

  // Register data about which fields are selected and supposed to be mapped to nodes
  private registerSelectedFieldsToNodes(
    targets: SelectTargetSqlBuilder[]
  ): void {
    for (const builder of targets) {
      this.selectTargetSqlBuilders.push(builder);

      if (!(builder instanceof ColumnSelectTargetSqlBuilder)) {
        continue;
      }

      if (!builder.nodeAlias || !builder.fieldName) {
        continue;
      }

      if (!this.returningEntities()) {
        continue;
      }

      const node = this.targetNodesByAlias.get(builder.nodeAlias);

      if (!node) {
        throw new Error(`No target with alias ${builder.nodeAlias}`);
      }

      node.selectField(builder.fieldName, builder.as);
    }
  }

  // Make sure primary keys of entities we want to select are selected (if we need them)
  private ensurePrimaryKeySelection(node?: TargetNode<AnEntity>): void {
    // No desire to enforce selecing primary keys for raw results
    // Can't enforce selecting all primary keys when GROUP BY is used
    if (!this.returningEntities() || this.args.groupBys?.length || !node) {
      return;
    }

    // Skip nodes we are not selecting from
    if (node.select || node.selectedFields.length) {
      // Add a select target for the primary key of the node if its not selected already
      if (
        !node.selectedFields.find(
          (e) =>
            e.selectTarget ===
            `${node.alias}.${node.primaryKeyColumn.fieldName}`
        )
      ) {
        this.selectTargetSqlBuilders.push(
          SelectTargetSqlBuilderFactory.createColumnIdentifier(
            ColumnIdentifierSqlBuilderFactory.createColumnMeta(
              node.alias,
              node.primaryKeyColumn
            ),
            `${node.alias}.${node.primaryKeyColumn.fieldName}`
          )
        );
      }
    }

    for (const key in node.joins) {
      this.ensurePrimaryKeySelection(node.joins[key]!);
    }
  }

  //
  // Utils
  //

  private returningEntities(): boolean {
    return this.args.resultType === QueryResultType.ENTITIES;
  }
}
