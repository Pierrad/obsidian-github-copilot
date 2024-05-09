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
}

export default Json;
