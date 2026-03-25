import { PowerCycleApi } from "@powercycle/shared/api/Api";
import { FetchHttpClient } from "effect/unstable/http";
import { AtomHttpApi } from "effect/unstable/reactivity";

/**
 * Typed API client for PowerCycleApi.
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
	},
) {}
