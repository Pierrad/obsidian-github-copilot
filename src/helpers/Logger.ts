class Logger {
	private static instance: Logger;
	private isEnabled = false;

	private constructor() {}

	public static getInstance(): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger();
		}
		return Logger.instance;
	}

	getDebug(): boolean {
		return this.isEnabled;
	}

	setDebug(isEnabled: boolean): void {
		this.isEnabled = isEnabled;
	}

	log(message: string): void {
		if (this.isEnabled) {
			console.log(message);
		}
	}

	error(message: string): void {
		if (this.isEnabled) {
			console.error(message);
		}
	}
}

export default Logger;
