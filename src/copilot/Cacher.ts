class Cacher {
  // Map<file path, file version>
  private fileCache: Map<string, number>;

  private static instance: Cacher;

  private constructor() {
    this.fileCache = new Map();
  }

  public static getInstance(): Cacher {
    if (!Cacher.instance) {
      Cacher.instance = new Cacher();
    }
    return Cacher.instance;
  }

  public updateCache(filePath: string, version: number): void {
    this.fileCache.set(filePath, version);
  }

  public getCache(filePath: string): number {
    return this.fileCache.get(filePath) || 0;
  }

  public clearCache(): void {
    this.fileCache.clear();
  }
}

export default Cacher;
