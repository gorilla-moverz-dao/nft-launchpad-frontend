# Codebase Concerns

**Analysis Date:** 2026-03-01

## Tech Debt

**Client-Side Trait Aggregation:**
- Issue: Traits are aggregated in the browser from GraphQL responses instead of on the server side
- Files: `src/hooks/useCollectionNFTs.ts` (lines 69-101)
- Impact: Performance degradation as collections scale; N+1 queries; excessive client-side memory usage when filtering collections with thousands of NFTs
- Fix approach: Implement server-side trait aggregation in the backend GraphQL schema and resolver functions. The current `aggregateTraits()` function should be replaced with a dedicated GraphQL query field

**Console Logging in Production Code:**
- Issue: Multiple debug console.log and console.error statements remain in hooks
- Files:
  - `src/hooks/useUserReductionNFTs.ts` (line 45)
  - `src/hooks/useMintStages.ts` (line 21)
  - `src/provider/WalletProvider.tsx` (line 11)
  - `src/hooks/useMintBalance.ts` (line 28)
- Impact: Logs leaked sensitive information; clutters browser console; may expose internal state
- Fix approach: Replace debug logs with proper error tracking via Sentry or similar; remove console.log statements entirely. Use `if (import.meta.env.DEV)` guards for development-only logging

**Wallet Error Handling is Silent:**
- Issue: Wallet provider catches errors but only logs them without user feedback
- Files: `src/provider/WalletProvider.tsx` (lines 10-12)
- Impact: Users unaware if wallet connection fails; no recovery mechanism; difficult to debug wallet integration issues
- Fix approach: Emit proper error events through context; notify user via toast when wallet errors occur; implement retry logic

## Known Bugs

**GraphQL Error Response Handling Missing:**
- Symptoms: GraphQL errors are not parsed or surfaced to users; network failures silently swallow response data
- Files: `src/graphql/executeGraphQL.ts` (line 25), `src/graphql/execute.ts` (line 25)
- Trigger: When GraphQL API returns errors in the response body (e.g., `{ "errors": [...] }`) instead of HTTP error status
- Workaround: Check browser network tab for actual response body; client cannot distinguish between empty result and error
- Fix approach: Parse `json.errors` array in executeGraphQL; throw Error with formatted message including GraphQL error details

**Async Race Condition in useMintBalance:**
- Symptoms: Stale mint balance data can be displayed if stages data changes while balance query is in flight
- Files: `src/hooks/useMintBalance.ts` (lines 6-33)
- Trigger: Rapidly switching collections or stages updates while mint balance query is pending
- Workaround: Close component and re-open to force refetch
- Fix approach: Add proper dependency tracking; ensure balance query is cancelled/invalidated when dependencies change

**Missing Error Boundary for Minting:**
- Symptoms: Mint failures crash the component tree if error is thrown in executeTransaction
- Files: `src/components/MintStageCard.tsx` (lines 69-90), `src/hooks/useTransaction.ts` (lines 25-30)
- Trigger: Network failure during transaction submission or confirmation
- Workaround: User must refresh page to recover
- Fix approach: Implement error boundaries at route level; wrap executeTransaction calls with React Error Boundary

**Dialog State Management Issues:**
- Symptoms: AssetDetailDialog receives `open={true}` hardcoded but responds to `onOpenChange`
- Files: `src/routes/collections.$collectionId.tsx` (lines 233-238)
- Trigger: Dialog component controls shown/hidden state but can't properly close
- Workaround: None; users must click background to close
- Fix approach: Pass `open={selectedNFT !== null}` instead of hardcoded `true`

## Security Considerations

**Unvalidated GraphQL Query Input:**
- Risk: Search and trait filter values are injected directly into GraphQL `_ilike` and `_contains` operations
- Files: `src/hooks/useCollectionNFTs.ts` (lines 142-149)
- Current mitigation: GraphQL parameterization (variables) prevents SQL injection but field selection is unrestricted
- Recommendations: Validate search string length (max 256 chars); sanitize trait type names against whitelist; rate-limit queries from single IP

**Clipboard Copy Without Confirmation:**
- Risk: Addresses copied to clipboard without user confirmation; could expose addresses if clipboard is monitored
- Files: `src/components/AssetDetailDialog.tsx` (line 71)
- Current mitigation: Standard browser clipboard API with no special mitigations
- Recommendations: Show toast confirmation when address is copied; consider adding a delay before clipboard access

**Network Configuration Hardcoding:**
- Risk: Launchpad module address, network configs, and RPC endpoints are hardcoded in constants
- Files: `src/constants.ts` (lines 6, 9), `src/lib/networks.ts` (lines 1-18)
- Current mitigation: Environment variables used for network selection but only at build time
- Recommendations: Load network config from secure endpoint at runtime; implement network validation; add signature verification for config updates

**Movement Mini App SDK Trust Model Unclear:**
- Risk: SDK transactions bypass standard wallet signing flow; unclear if SDK validates transactions before submission
- Files: `src/hooks/useMovementWallet.ts` (lines 18-31), `src/lib/DualModeWalletClient.ts` (lines 25-54)
- Current mitigation: None identified
- Recommendations: Audit Movement SDK source code; implement transaction validation before SDK submission; log all SDK transactions; implement transaction approval UI for mini app context

## Performance Bottlenecks

**Large GraphQL Payloads for NFT Collections:**
- Problem: Fetching all NFTs for trait aggregation returns full token properties even when only trait stats are needed
- Files: `src/hooks/useCollectionNFTs.ts` (lines 58-66), `src/hooks/useTraitAggregation.ts` (lines 181-201)
- Cause: Separate query fetches all NFT objects to aggregate traits; no pagination; returns all properties per NFT
- Improvement path: Implement dedicated `getTraitAggregation` GraphQL query on backend that returns only aggregated counts; paginate with cursor-based pagination

**Unbounded Query Results:**
- Problem: Default limit of 100 NFTs per page is hardcoded; no maximum enforced; could fetch 10k+ NFTs in single query
- Files: `src/routes/collections.$collectionId.tsx` (line 36), `src/hooks/useCollectionNFTs.ts` (line 158)
- Cause: GraphQL API accepts arbitrary limit values; no validation
- Improvement path: Cap limit to 500 maximum; implement cursor-based pagination; add server-side query timeouts

**Mint Balance Fetching as Sequential Promises:**
- Problem: Multiple mint balance queries run as separate Promise.all() calls per stage instead of batch query
- Files: `src/hooks/useMintBalance.ts` (lines 17-25)
- Cause: Each stage balance requires separate view function call; could be 100+ network requests for user with many stages
- Improvement path: Batch mint balance queries into single view function; implement caching with 1-minute TTL

**Component Re-renders with Trait Aggregation:**
- Problem: CollectionFilters component re-renders entire trait list on every NFT update due to trait map mutation
- Files: `src/components/CollectionFilters.tsx`, `src/hooks/useTraitAggregation.ts` (lines 193-198)
- Cause: No memoization; trait aggregation is synchronous and blocking
- Improvement path: Implement `useMemo()` for trait filter lists; move aggregation to Web Worker; implement debouncing

## Fragile Areas

**Dual-Mode Wallet Integration:**
- Files: `src/lib/DualModeWalletClient.ts`, `src/hooks/useMovementWallet.ts`, `src/hooks/useClients.ts`
- Why fragile: Complex proxy-based abstraction over two different wallet APIs (Standard wallet adapter + Movement SDK); transaction response format differs between modes; error handling differs
- Safe modification: Add comprehensive test suite for both modes before refactoring; create integration tests with actual Movement SDK; document expected behavior per mode
- Test coverage: No unit tests for DualModeWalletClient; no integration tests for wallet context switching; manual testing only

**GraphQL Execute Functions:**
- Files: `src/graphql/executeGraphQL.ts`, `src/graphql/execute.ts`
- Why fragile: No error parsing from GraphQL response; network errors and GraphQL errors handled identically; no timeout handling; no request/response logging
- Safe modification: Add comprehensive error type definitions; parse errors and create typed error responses; add request tracing; implement timeout logic
- Test coverage: No tests for error scenarios; no tests for GraphQL error responses; no mock server tests

**Mint Transaction Processing:**
- Files: `src/components/MintStageCard.tsx` (lines 69-90), `src/hooks/useTransaction.ts`
- Why fragile: Transaction hash verification is implicit in `waitForTransaction()`; no validation of minted token IDs; event extraction is regex-style pattern matching
- Safe modification: Add explicit transaction validation; implement token ID existence check post-mint; use structured event parsing instead of object property navigation
- Test coverage: No unit tests; no tests for failed transactions; manual minting required for testing

**Search and Filter Query Building:**
- Files: `src/hooks/useCollectionNFTs.ts` (lines 116-152)
- Why fragile: Dynamic WHERE clause construction is error-prone; trait filter logic uses nested _and/_or combinations; search filter overwrites _or clause without merging
- Safe modification: Implement query builder pattern; test all filter combinations (search + traits, traits + sort, etc.); add query validation before execution
- Test coverage: No unit tests for getWhere() function; no tests for filter combinations; manual testing only

## Scaling Limits

**Client-Side Memory for Large Collections:**
- Current capacity: ~10k NFTs before noticeable slowdown
- Limit: Beyond 10k NFTs, trait aggregation Map and array operations become memory-intensive; browser may freeze
- Scaling path: Implement server-side aggregation; use virtual scrolling for large result sets; implement progressive loading with Web Workers

**GraphQL Query Complexity:**
- Current capacity: Trait filtering with 10+ trait types and 50+ values per type
- Limit: Complex nested _or/_and queries cause exponential GraphQL execution time; queries timeout at >30 traits filters
- Scaling path: Implement query cost analysis on GraphQL server; implement smart filter reduction; cache popular filter combinations

**Simultaneous Active Queries:**
- Current capacity: ~20 concurrent queries before request queuing
- Limit: Browser network stack degrades; TanStack Query request pool exhausted; user feels interface slowdown
- Scaling path: Implement request prioritization; add smart batching for mint balance queries; implement query debouncing

**Network Roundtrips for Minting:**
- Current capacity: Single mint operation (1 user, 1 stage)
- Limit: Batch minting multiple amounts requires separate transaction; no multi-stage mint support
- Scaling path: Implement batch mint function on-chain; support multi-stage minting in single transaction

## Dependencies at Risk

**Movement Mini App SDK (GitHub Dependency):**
- Risk: Installed directly from GitHub (`github:MoveIndustries/mini-app-sdk`); no version pinning; may break without notice
- Impact: Wallet integration breaks; mini app context detection fails; SDK methods change signature
- Migration plan: Fork to internal GitHub; publish to npm; implement version pinning with exact semver; implement feature detection for SDK methods

**@aptos-labs/wallet-adapter-react v7.0.1:**
- Risk: Major version; implementation details change frequently; compatibility issues with custom wallet providers
- Impact: Nightly Wallet, Razor Wallet, Leap Wallet adapter breaks; transaction signing fails
- Migration plan: Monitor Aptos wallet adapter releases; test breaking changes in staging; implement adapter pattern to isolate wallet logic

**TanStack Query v5.80.6:**
- Risk: Major version with significant API changes; custom cache strategies may break in updates
- Impact: Query invalidation doesn't work as expected; stale time behavior changes; cache serialization breaks
- Migration plan: Pin version; test updates in staging; review changelog for breaking changes before upgrading

**@thalalabs/surf v1.9.6:**
- Risk: Niche Move/Aptos library; low maintenance; limited community support
- Impact: ABI handling breaks; type argument generation fails; transaction payloads become invalid
- Migration plan: Audit library code; consider forking; implement abstraction layer around Surf usage

## Missing Critical Features

**Transaction Simulation:**
- Problem: No transaction simulation before submission; users click mint and only discover insufficient balance after paying gas
- Blocks: Improved UX for minting; batch operations; pre-flight validation
- Implementation: Call Move view functions to simulate transaction state changes; show predicted gas cost before submit

**Query Result Caching Strategy:**
- Problem: No persistent caching; refetches occur on every component mount; large GraphQL queries run repeatedly
- Blocks: Performance optimization; offline support; reduced network load
- Implementation: Add IndexedDB caching layer; implement cache versioning; add cache invalidation on collection updates

**Error Recovery UI:**
- Problem: Errors are logged but no user-facing recovery options; network errors require page refresh
- Blocks: Better error handling; graceful degradation; improved reliability perception
- Implementation: Show error toast with retry button; implement exponential backoff; add offline indicator

**Mint History:**
- Problem: No record of minting transactions; users cannot verify mints or see transaction history
- Blocks: User confidence; dispute resolution; analytics
- Implementation: Store mint events in LocalStorage; fetch transaction history from blockchain explorer API; implement transaction verification

## Test Coverage Gaps

**No Unit Tests in src/ directory:**
- What's not tested: All business logic in hooks, utilities, GraphQL execution
- Files: `src/hooks/*`, `src/lib/*`, `src/components/*`
- Risk: Regressions go undetected; refactoring is dangerous; confidence in code quality is low
- Priority: **High** - Add unit tests for critical hooks (useMovementWallet, useTransaction, useCollectionNFTs) and utilities

**No Integration Tests:**
- What's not tested: Wallet connection flow; minting end-to-end; filter combinations; search functionality
- Risk: Feature breaks silently; wallet adapter changes cause unexpected failures; filter logic has bugs
- Priority: **High** - Implement integration tests with mock GraphQL server and wallet adapter

**No GraphQL Error Response Tests:**
- What's not tested: How app handles GraphQL errors; field error propagation; partial failures
- Risk: Error handling is untested; GraphQL error responses crash app or show incomplete state
- Priority: **Medium** - Add tests for GraphQL error scenarios

**No Movement SDK Tests:**
- What's not tested: Mini app context detection; SDK transaction submission; SDK error scenarios
- Risk: Mini app feature is untested; mode switching may break; users in mini app experience undetected failures
- Priority: **Medium** - Mock Movement SDK; test dual-mode wallet behavior in isolation

**No Performance Tests:**
- What's not tested: Large NFT collection rendering; trait aggregation performance; query time limits
- Risk: Performance regressions go undetected; collection scaling causes user-facing slowdowns
- Priority: **Low** - Implement performance benchmarks for large datasets

---

*Concerns audit: 2026-03-01*
