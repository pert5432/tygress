type PathKey = string | number;

type PathMapMap<T> = Map<PathKey, PathMapMap<T>> | { val: T };

export class PathMap<Payload> {
  private map: Map<PathKey, PathMapMap<Payload>> = new Map();

  get(keys: PathKey[]): PathMapMap<Payload> | Payload | undefined {
    let currentMap = this.map;

    // Traverse path backwards
    for (let i = keys.length - 1; i >= 0; i -= 1) {
      const value = currentMap.get(keys[i]!);

      if (!value) {
        return value;
      }

      if ((value as { val: Payload }).val) {
        if (i === 0) {
          return (value as { val: Payload }).val;
        }

        return undefined;
      } else {
        // Value is a map
        currentMap = value as Map<PathKey, PathMapMap<Payload>>;
      }
    }

    return currentMap;
  }

  has(keys: PathKey[]): boolean {
    return !!this.get(keys);
  }

  set<T extends Payload>(keys: PathKey[], input: T): void {
    let val = this.map;

    // Traverse maps until val contains last map we want to write into
    for (let i = keys.length - 1; i >= 1; i -= 1) {
      const key = keys[i]!;

      const existingValue = val.get(key);

      if (!existingValue || (existingValue as { val: Payload }).val) {
        const newMap = new Map();
        val.set(key, newMap);

        val = newMap;
        continue;
      }

      val = existingValue as Map<PathKey, PathMapMap<Payload>>;
    }

    // Write last key if needed
    const lastKey = keys[0]!;
    if (!val.get(lastKey)) {
      val.set(lastKey, { val: input });
    }
  }
}
