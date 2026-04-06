# @form-wizard-framework/eslint-config

## 3.0.1

### Patch Changes

- 6dd64d9: Fix NaN when concatenating number with absent extension in postcode address lookup.

  When `concatenateExtension` is true and an address has no extension (e.g. a stored address returned by the API), the extension key was deleted before concatenation, causing `number + undefined = NaN`. The fix coerces the number to a string and treats a missing extension as an empty string.

  The shared ESLint config is also bumped from `es2018` to `es2020` to allow nullish coalescing (`??`), consistent with the Node >=24 engine requirement.

## 3.0.0

### Major Changes

- f8aa089: Drop support for Node.js < 24. All packages now require Node.js >= 24.0.0.

## 2.0.0

### Major Changes

- 522d652: Update the Node env to ES2018

## 1.0.0

### Major Changes

- fd5c04d: adds .jest.js files to also use the same eslint rules for test files

## 0.1.0

### Minor Changes

- 9efbcd4: adds initial eslint setup
