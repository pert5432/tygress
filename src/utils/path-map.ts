export type PathKey = string | number;

export class PathMap<Payload> {
  constructor(private depth: number) {}

  private map = new Map();

  get(keys: PathKey[]): Payload | undefined {
    let currentMap = this.map;

    // Traverse path backwards
    for (let i = this.depth - 1; i > 0; i -= 1) {
      currentMap = currentMap.get(keys[i]!);

      if (!currentMap) {
        return undefined;
      }
    }

    return currentMap.get(keys[0]);
  }

  has(keys: PathKey[]): boolean {
    let currentMap = this.map;

    // Traverse path backwards
    for (let i = this.depth - 1; i > 0; i -= 1) {
      currentMap = currentMap.get(keys[i]!);

      if (!currentMap) {
        return false;
      }
    }

    return currentMap.has(keys[0]!);
  }

  set<T extends Payload>(keys: PathKey[], input: T): void {
    let currentMap = this.map;

    // Traverse maps until we reach the last one
    for (let i = this.depth - 1; i > 0; i -= 1) {
      const existingValue = currentMap.get(keys[i]!);

      if (!existingValue) {
        const newMap = new Map();
        currentMap.set(keys[i]!, newMap);

        currentMap = newMap;
      } else {
        currentMap = existingValue;
      }
    }

    // Write into last map
    currentMap.set(keys[0]!, input);
  }
}
