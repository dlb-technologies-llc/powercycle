export const getAllowedOrigins = (env?: string) => {
	if (env === "production") return ["https://powercycle.app"];
	if (env === "staging") return ["https://staging.powercycle.app"];
	return ["http://localhost:4321"];
};
