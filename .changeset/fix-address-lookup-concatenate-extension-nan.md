---
'@form-wizard-framework/address-lookup': patch
'@form-wizard-framework/eslint-config': patch
---

Fix NaN when concatenating number with absent extension in postcode address lookup.

When `concatenateExtension` is true and an address has no extension (e.g. a stored address returned by the API), the extension key was deleted before concatenation, causing `number + undefined = NaN`. The fix coerces the number to a string and treats a missing extension as an empty string.

The shared ESLint config is also bumped from `es2018` to `es2020` to allow nullish coalescing (`??`), consistent with the Node >=24 engine requirement.
