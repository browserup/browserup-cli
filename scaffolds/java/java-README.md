To compile:

Requirements:
* Java 11 or higher on the PATH
* Maven


```bash
mvn compile
```

To run:

```bash
mvn exec:java -Dexec.mainClass="org.example.Main"
```

Building a FAT Jar for BrowserUp:

```bash
mvn clean package
```

