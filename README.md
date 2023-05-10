
Running from the command line:

```bash
./bin/browserup.mjs cluster
```

## Running the tests:

We use modules, so you need to pass this flag to node:
```bash
node --experimental-vm-modules
```

Running a single test:
```bash
jest -t 'displays load start'
```

# Important! TESTING NOTE!

You NEED to pass --experimental-vm-modules to node, otherwise you will get this error:
    In IntelliJ, each test needs this flag pasted into NODE OPTIONS: --experimental-vm-modules

If you don't, you'll see an error like:

```
Test suite failed to run

    Jest encountered an unexpected token

    Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.
```

Packaging the CLI

https://medium.com/netscape/a-guide-to-create-a-nodejs-command-line-package-c2166ad0452e
