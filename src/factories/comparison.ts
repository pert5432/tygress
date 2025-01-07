import {
  ColColComparison,
  ColParamComparison,
} from "../sql-builders/comparison/comparison";
import {
  ColColComparisonArgs,
  ColParamComparisonArgs,
} from "../types/create-args/comparison";

export abstract class ComparisonFactory {
  public static createColCol(args: ColColComparisonArgs): ColColComparison {
    return new ColColComparison(args);
  }

  public static createColParam(
    args: ColParamComparisonArgs
  ): ColParamComparison {
    return new ColParamComparison(args);
  }
}
