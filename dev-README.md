# Development / Testing / Contributing

## Running the tests:


Running a single test:
```bash
jest -t "displays load start"
```

### Testing note:

We use modules, so you need to pass this flag to node:
```bash
node --experimental-vm-modules
```

You need to pass --experimental-vm-modules to node, otherwise you will get this error:
In IntelliJ, each test needs this flag pasted into NODE OPTIONS: --experimental-vm-modules

If you don"t, you"ll see an error like:
```
Test suite failed to run

    Jest encountered an unexpected token

    Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.
```

# Running ESlint:

ESLint won't see the mjs files without help
```bash
# ESLint won't see the mjs files without help
npx eslint --ext .mjs .
```
