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
}

export default Json;
