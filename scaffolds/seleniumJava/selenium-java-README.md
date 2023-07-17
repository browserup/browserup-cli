

# Selenium Java Demo for BrowserUp

In order to use this scaffold in a load test, you should first run:

```bash
mvn clean install
```

This requires the usual setup for Java development, including:
* Java 11 or later
* Java Development Kit (JDK)
* Maven

This project also looks for the following environment variables:
* CHROMEDRIVER_PATH, which is the location of your chromedriver binary

This variable is automatically set when running inside BrowserUp containers.

You'll need to compile before running 
```bash
browserup load start
```

## Running the sample locally:

```bash
java -jar java-demo-1.0-SNAPSHOT-jar-with-dependencies.jar
```


