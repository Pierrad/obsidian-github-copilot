/* eslint-disable @typescript-eslint/no-explicit-any */

class Json {
	public static extractJsonObject(input: string): object | null {
		const jsonString = input.trim().replace(/^[^{]+/, "");

		if (jsonString.startsWith("{") && jsonString.endsWith("}")) {
			try {
				const jsonObject = JSON.parse(jsonString);
				return jsonObject;
			} catch (error) {
				console.error(`Error parsing JSON: ${error}`);
			}
		}
		return null;
	}

	public static textToJsonObject(input: string): object | null {
		const jsonObject = this.extractJsonObject(input);
		if (jsonObject) {
			return jsonObject;
		}
		return null;
	}

	public static jsonObjectToText(jsonObject: object): string {
		return JSON.stringify(jsonObject, null, 2);
	}

	public static onlyKeepProperties(
		jsonObject: { [key: string]: any },
		properties: string[],
	): object {
		return properties.reduce((obj: any, key) => {
			if (jsonObject.hasOwnProperty(key)) {
				obj[key] = jsonObject[key];
			}
			return obj;
		}, {});
	}

	/**
	 * Separate multiple JSON objects from a string. Each JSON object is expected to start with "Content-Length: XX"
	 * @param input The input string containing multiple JSON objects
	 * @returns An array of JSON object strings
	 */
	public static splitJsonObjects(input: string): string[] {
		const regex =
			/Content-Length:\s*\d+\s*([\s\S]*?)(?=Content-Length:|$)/g;
		const matches = [];
		let match;

		while ((match = regex.exec(input)) !== null) {
			matches.push(match[1].trim());
		}

		return matches;
	}
}

export default Json;
