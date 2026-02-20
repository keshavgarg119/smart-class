# Running Selenium Tests for Smart Attendance System

## Prerequisites
1. **Java Development Kit (JDK)** installed (version 11 or higher).
2. **Maven** (optional, but recommended for dependency management) OR manually download JARs.
3. **Google Chrome** installed.
4. **ChromeDriver** matching your Chrome version.

## Setup

### Option 1: Maven Project (Recommended)
Add the following dependencies to your `pom.xml`:

```xml
<dependencies>
    <!-- Selenium Java -->
    <dependency>
        <groupId>org.seleniumhq.selenium</groupId>
        <artifactId>selenium-java</artifactId>
        <version>4.16.1</version>
    </dependency>
    <!-- WebDriver Manager (Optional, handles driver binaries) -->
    <dependency>
        <groupId>io.github.bonigarcia</groupId>
        <artifactId>webdrivermanager</artifactId>
        <version>5.6.3</version>
    </dependency>
</dependencies>
```

### Option 2: Manual Classpath
Download `selenium-java` JARs and add them to your project's classpath.

## Running the Test
1. Compile the Java file:
   ```bash
   javac -cp "path/to/selenium-jars/*" SmartAttendanceTest.java
   ```
2. Run the test:
   ```bash
   java -cp ".;path/to/selenium-jars/*" SmartAttendanceTest
   ```

*Note: Update the `BASE_URL` and Login credentials in `SmartAttendanceTest.java` to match your local environment before running.*
