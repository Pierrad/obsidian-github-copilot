type FileCache = Map<string, number>;
type CurrentFilePath = {
	basePath: string;
	filePath: string;
};

class Cacher {
	// Map<file path, file version>
	private fileCache: FileCache;
	private currentFilePath: CurrentFilePath;

	private static instance: Cacher;

	private constructor() {
		this.fileCache = new Map();
		this.currentFilePath = {
			basePath: "",
			filePath: "",
		};
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

	public setCurrentFilePath(basePath: string, filePath: string): void {
		this.currentFilePath = {
			basePath,
			filePath,
		};
	}

	public getCurrentFilePath(): CurrentFilePath {
		return this.currentFilePath;
	}
}

export default Cacher;
