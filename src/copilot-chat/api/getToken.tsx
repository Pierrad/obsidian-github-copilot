import { useMutation } from "@tanstack/react-query";
import { requestUrl, RequestUrlResponse } from "obsidian";

export const getToken = (onSuccess: (data: any) => void) => {
	const mutation = useMutation({
		mutationFn: async (pat: string) => {
			const response: RequestUrlResponse = await requestUrl( {
				url: "https://api.github.com/copilot_internal/v2/token", 
				method: "GET",
				headers: {
					"editor-version": "Neovim/0.6.1",
					"editor-plugin-version": "copilot.vim/1.16.0",
					"user-agent": "GithubCopilot/1.155.0",
					"Authorization": `Bearer ${pat}`,
				},
			});
			if (response.status !== 200) {
				throw new Error("Network response was not ok");
			}
			const data = await response.json;
			return data;
		},
    onSuccess,
	});

	return mutation;
};
