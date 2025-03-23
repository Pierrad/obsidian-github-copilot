import { useMutation } from "@tanstack/react-query";
import { requestUrl, RequestUrlResponse } from "obsidian";

export const getPAT = (onSuccess: (data: any) => void) => {
	const mutation = useMutation({
		mutationFn: async (deviceCode: string) => {
			const response: RequestUrlResponse = await requestUrl( {
				url: "https://github.com/login/oauth/access_token", 
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					accept: "application/json",
					"editor-version": "Neovim/0.6.1",
					"editor-plugin-version": "copilot.vim/1.16.0",
					"user-agent": "GithubCopilot/1.155.0",
					"accept-encoding": "gzip, deflate, br",
				},
				body: JSON.stringify({
          "client_id": "Iv1.b507a08c87ecfe98",
          "device_code": deviceCode,
          "grant_type": "urn:ietf:params:oauth:grant-type:device_code"
				}),
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
