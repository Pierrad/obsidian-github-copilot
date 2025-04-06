export const concat = (str1: string, str2: string): string => {
	return `${str1}-${str2}`;
};

export const cx = (...classNames: string[]): string => {
	return classNames.filter(Boolean).join(" ");
};
