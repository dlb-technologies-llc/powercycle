import { PowerCycleApi } from "@powercycle/shared/api/Api";
import {
	FetchHttpClient,
	HttpClient,
	HttpClientRequest,
} from "effect/unstable/http";
import { AtomHttpApi } from "effect/unstable/reactivity";

const TOKEN_KEY = "powercycle_token";

/**
 * Typed API client for PowerCycleApi with auth token injection.
 *
 * Usage:
 *   - `ApiClient.query("group", "endpoint", { ...request })` for queries
 *   - `ApiClient.mutation("group", "endpoint")` for mutations
 *   - `ApiClient.runtime` for creating custom atoms
 */
export class ApiClient extends AtomHttpApi.Service<ApiClient>()(
	"PowerCycleApiClient",
	{
		api: PowerCycleApi,
		httpClient: FetchHttpClient.layer,
		transformClient: (client) =>
			client.pipe(
				HttpClient.mapRequest((req) => {
					const token =
						typeof window !== "undefined"
							? localStorage.getItem(TOKEN_KEY)
							: null;
					return token ? HttpClientRequest.bearerToken(req, token) : req;
				}),
			),
	},
) {}
