import type { TypedDocumentString } from "./graphql";
import { APTOS_INDEXER_URL } from "@/constants";

export async function execute<TResult, TVariables>(
	query: TypedDocumentString<TResult, TVariables>,
	...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
) {
	const response = await fetch(APTOS_INDEXER_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/graphql-response+json",
		},
		body: JSON.stringify({
			query: query.toString(),
			variables,
		}),
	});

	if (!response.ok) {
		throw new Error("Network response was not ok");
	}

	const result = await response.json();
	return result.data as TResult;
}
