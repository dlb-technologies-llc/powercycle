import { PowerCycleApi } from "@powercycle/shared/api/Api";
import {
	FetchHttpClient,
	HttpClient,
	HttpClientRequest,
} from "effect/unstable/http";
import { AtomHttpApi } from "effect/unstable/reactivity";
import { getToken } from "../lib/api";

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
					const token = getToken();
					return token ? HttpClientRequest.bearerToken(req, token) : req;
				}),
			),
	},
) {}
