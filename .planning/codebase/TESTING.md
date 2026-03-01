# Testing Patterns

**Analysis Date:** 2026-03-01

## Test Framework

**Runner:**
- Vitest 3.0.5
- Config: Configured in `vite.config.js` under `test` section

**Assertion Library:**
- Testing Library (React components): `@testing-library/react` 16.2.0
- Testing Library DOM: `@testing-library/dom` 10.4.0

**Run Commands:**
```bash
npm run test                    # Run all tests (vitest run)
npm run test -- --watch        # Watch mode (implied by package.json)
npm run test -- --coverage     # Generate coverage report (inferred)
```

## Test Configuration

**Vitest Config** (`vite.config.js`):
```javascript
test: {
  globals: true,
  environment: "jsdom",
}
```

**Key Settings:**
- `globals: true` - Makes test functions (`describe`, `it`, `expect`) available without imports
- `environment: "jsdom"` - Simulates browser DOM for React component testing
- Runs in Node.js with JSDOM for realistic browser API simulation

## Test File Organization

**Location:**
- Co-located with source files (convention observed in project structure)
- No dedicated `__tests__` directory found; tests would be placed alongside source

**Naming Pattern:**
- `.test.ts` or `.test.tsx` for unit tests
- `.spec.ts` or `.spec.tsx` for spec-style tests
- Naming mirrors source file: `Component.tsx` → `Component.test.tsx`

**Directory Pattern**:
```
src/
├── hooks/
│   ├── useCollectionNFTs.ts
│   └── useCollectionNFTs.test.ts
├── components/
│   ├── MintStageCard.tsx
│   └── MintStageCard.test.tsx
└── lib/
    ├── utils.ts
    └── utils.test.ts
```

## Current Test Coverage

**Status:** No test files currently exist in the project.

**Coverage:** Not measured (no tests implemented)

**Gap:** Unit tests not established despite critical business logic in:
- `src/hooks/useCollectionNFTs.ts` - NFT query and trait aggregation
- `src/hooks/useTransaction.ts` - Transaction execution and error handling
- `src/lib/utils.ts` - Address normalization and conversion functions
- `src/lib/DualModeWalletClient.ts` - Dual wallet mode routing
- `src/components/MintStageCard.tsx` - Minting logic and validation

## Testing Patterns (Recommended Structure)

**Suite Organization** (template based on TanStack patterns):
```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { render, screen } from "@testing-library/react";

describe("ComponentName", () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it("should render with default props", () => {
    // Arrange
    // Act
    // Assert
  });

  it("should handle user interaction", () => {
    // Test implementation
  });
});
```

**Hook Testing Pattern** (for testing hooks like `useCollectionNFTs`):
```typescript
describe("useCollectionNFTs", () => {
  it("should fetch NFTs with correct parameters", () => {
    const { result } = renderHook(() =>
      useCollectionNFTs({
        onlyOwned: false,
        collectionIds: ["0x123"],
      })
    );

    expect(result.current.isLoading).toBe(true);
    // Wait for async completion and assert data
  });
});
```

**Component Testing Pattern** (for React components):
```typescript
describe("MintStageCard", () => {
  it("should display mint button when stage is active", () => {
    const mockStage = {
      name: "Public Mint",
      start_time: Math.floor(Date.now() / 1000),
      end_time: Math.floor(Date.now() / 1000) + 86400,
      mint_fee: 1000000,
      mint_fee_with_reduction: 800000,
    };

    render(
      <MintStageCard
        stage={mockStage}
        collectionId="0x123"
        mintBalance={[]}
        onMintSuccess={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /mint/i })).toBeInTheDocument();
  });
});
```

## Mocking Strategy

**Framework:** Vitest built-in mocking (compatible with Jest API)

**What to Mock:**
- External API calls (GraphQL queries via `executeGraphQL`)
- Wallet adapter interactions (`useWallet`, `useMovementWallet`)
- Browser APIs (localStorage, navigator)
- Third-party hooks (TanStack Query)

**What NOT to Mock:**
- Utility functions (`cn`, `normalizeHexAddress`, `oaptToApt`)
- Custom React hooks' internal logic (unless they're integration tests)
- DOM events (use Testing Library user events)

**Mocking Pattern Example** (for `useCollectionNFTs`):
```typescript
import { vi } from "vitest";

vi.mock("@/graphql/executeGraphQL", () => ({
  executeGraphQL: vi.fn(async () => ({
    current_token_ownerships_v2: [],
  })),
}));

vi.mock("@/hooks/useMovementWallet", () => ({
  useMovementWallet: () => ({
    address: "0x123",
    connected: true,
  }),
}));
```

**Mocking TanStack Query**:
```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

// Wrap components in test with provider
<QueryClientProvider client={createTestQueryClient()}>
  <ComponentUnderTest />
</QueryClientProvider>
```

## Test Data & Fixtures

**Test Data Location:**
- Fixtures would be placed in `src/__fixtures__/` or within test files as objects
- Example fixture pattern:

```typescript
// In test file or fixtures file
const mockNFT = {
  current_token_data: {
    token_name: "Test NFT",
    token_uri: "https://example.com/nft.json",
    collection_id: "0x123",
    token_properties: { rarity: "rare" },
  },
  current_token_ownerships_v2: {
    owner_address: "0xabc",
    amount: 1,
    token_data_id: "0xdef",
  },
};

const mockMintStage = {
  name: "Public Mint",
  start_time: 1609459200,
  end_time: 1609545600,
  mint_fee: 1000000,
  mint_fee_with_reduction: 800000,
};
```

## Test Types

**Unit Tests:**
- Scope: Individual functions and hooks
- Approach: Test with mocked dependencies
- Example: Testing `normalizeHexAddress()` with various input formats
- Example: Testing `oaptToApt()` conversion logic
- Tools: Vitest + Testing Library for hooks

**Integration Tests:**
- Scope: Component behavior with hooks and UI interactions
- Approach: Render component, mock API responses, test user interactions
- Example: Testing `MintStageCard` with mocked transaction hook
- Example: Testing `WalletSelector` with mocked wallet adapter
- Tools: Testing Library `render` + user events (`userEvent`)

**E2E Tests:**
- Framework: Not currently implemented
- Recommendation: Playwright or Cypress would be suitable for end-to-end flows
- Example flows: Full mint journey, wallet connection, collection browsing

## Common Test Patterns

**Async Testing:**
```typescript
describe("Async Operations", () => {
  it("should wait for async operation completion", async () => {
    const { result } = renderHook(() => useCollectionNFTs({
      onlyOwned: false,
      collectionIds: ["0x123"]
    }));

    expect(result.current.isLoading).toBe(true);

    // Wait for the hook to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });

  it("should handle async errors", async () => {
    const { result } = renderHook(() => useTransaction());

    await act(async () => {
      await expect(
        result.current.executeTransaction(() => Promise.reject(new Error("Tx failed")))
      ).rejects.toThrow("Tx failed");
    });

    expect(result.current.error?.message).toBe("Tx failed");
  });
});
```

**Error Testing:**
```typescript
describe("Error Handling", () => {
  it("should display error toast on transaction failure", async () => {
    const { result } = renderHook(() => useTransaction());

    const toastSpy = vi.spyOn(toast, "error");

    await act(async () => {
      try {
        await result.current.executeTransaction(() => Promise.reject(new Error("Network error")));
      } catch (e) {
        // Expected
      }
    });

    expect(toastSpy).toHaveBeenCalledWith("Network error");
  });

  it("should suppress error toast when showError is false", async () => {
    const { result } = renderHook(() => useTransaction({ showError: false }));

    const toastSpy = vi.spyOn(toast, "error");

    await act(async () => {
      try {
        await result.current.executeTransaction(() => Promise.reject(new Error("Silent error")));
      } catch (e) {
        // Expected
      }
    });

    expect(toastSpy).not.toHaveBeenCalled();
  });
});
```

**User Interaction Testing:**
```typescript
import { userEvent } from "@testing-library/user-event";

describe("MintStageCard User Interactions", () => {
  it("should update mint amount on input change", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(
      <MintStageCard
        stage={activeMintStage}
        collectionId="0x123"
        mintBalance={[{ stage: "Public", balance: 5 }]}
        onMintSuccess={onSuccess}
      />
    );

    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "3");

    expect(input).toHaveValue(3);
  });

  it("should call onMintSuccess after successful mint", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    const mockExecuteTransaction = vi.fn().mockResolvedValue({
      result: {
        events: [{
          type: "0x123::nft_launchpad::BatchMintNftsEvent",
          data: { nft_objs: [{ inner: "0xabc" }] },
        }],
      },
    });

    vi.mock("@/hooks/useTransaction", () => ({
      useTransaction: () => ({
        executeTransaction: mockExecuteTransaction,
        transactionInProgress: false,
      }),
    }));

    render(
      <MintStageCard
        stage={activeMintStage}
        collectionId="0x123"
        mintBalance={[{ stage: "Public", balance: 5 }]}
        onMintSuccess={onSuccess}
      />
    );

    const mintButton = screen.getByRole("button", { name: /mint/i });
    await user.click(mintButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(["0xabc"]);
    });
  });
});
```

## Coverage Strategy

**Recommended Targets:**
- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

**High Priority for Testing:**
- `src/hooks/` - All custom hooks (critical business logic)
- `src/lib/DualModeWalletClient.ts` - Wallet routing logic
- `src/lib/utils.ts` - Utility functions
- `src/components/MintStageCard.tsx` - Minting workflow
- `src/components/WalletSelector.tsx` - Wallet connection flow

**Lower Priority:**
- `src/components/ui/` - Radix-based UI wrapper components (well-tested upstream)
- Auto-generated files: `src/graphql/`, `src/routeTree.gen.ts`

---

*Testing analysis: 2026-03-01*
