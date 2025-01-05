import { ColColComparison, ColParamComparison } from "../types/comparison";
import {
  ColColComparisonArgs,
  ColParamComparisonArgs,
} from "../types/comparison-args";

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
