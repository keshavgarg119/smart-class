package com.smartclass.tests;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.*;
import org.testng.Assert;
import org.testng.annotations.*;

import java.io.*;
import java.time.Duration;
import java.util.*;

public class UnifiedAuthTest {
    protected WebDriver driver;
    protected final String BASE_URL = "http://localhost:5173";

    // 🔹 Delay control
    public void slow(int millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    @BeforeMethod
    public void setUp() {
        WebDriverManager.chromedriver().setup();
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    }

    @AfterMethod
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    // -------- CSV Utility --------
    public static Object[][] readCSV(String filePath) {
        List<Object[]> lines = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {
            String line;
            boolean firstLine = true;
            while ((line = br.readLine()) != null) {
                if (firstLine) { firstLine = false; continue; }
                String[] data = line.split(",", -1);
                for (int i = 0; i < data.length; i++) {
                    data[i] = data[i].replaceAll("^\"|\"$", "").trim();
                }
                lines.add(data);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return lines.toArray(new Object[0][]);
    }

    @DataProvider(name = "loginData")
    public Object[][] getLoginData() {
        return readCSV("src/test/resources/testdata/login_data.csv");
    }

    @DataProvider(name = "registrationData")
    public Object[][] getRegistrationData() {
        return readCSV("src/test/resources/testdata/registration_data.csv");
    }

    // -------- LOGIN TEST --------
    @Test(dataProvider = "loginData", priority = 2)
    public void testLogin(String email, String password, String role,
                         String expectedUrlFragment, String expectedErrorMsg) {

        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        driver.get(BASE_URL + "/login");
        slow(1500);

        WebElement emailInput = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.name("email")));
        emailInput.clear();
        emailInput.sendKeys(email);
        slow(1000);

        driver.findElement(By.name("password")).sendKeys(password);
        slow(1000);

        new Select(driver.findElement(By.name("role"))).selectByValue(role);
        slow(1000);

        driver.findElement(By.cssSelector("button[type='submit']")).click();
        slow(2000);

        if (expectedUrlFragment != null && !expectedUrlFragment.isEmpty()) {
            boolean urlChanged = wait.until(ExpectedConditions.urlContains(expectedUrlFragment));
            Assert.assertTrue(urlChanged, "Login failed or redirect issue");
        } else if (expectedErrorMsg != null && !expectedErrorMsg.isEmpty()) {
            WebElement errorMsg = wait.until(
                    ExpectedConditions.visibilityOfElementLocated(By.className("error-message")));
            Assert.assertTrue(errorMsg.getText().contains(expectedErrorMsg));
        }
    }

    // -------- REGISTRATION TEST --------
    @Test(dataProvider = "registrationData", priority = 1)
    public void testRegistration(String name, String email, String password,
                                String confirmPassword, String role,
                                String studentId, String department, String semester,
                                String expectedUrlFragment, String expectedErrorMsg) {

        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        driver.get(BASE_URL + "/register");
        slow(1500);

        String testEmail = email;
        if (expectedUrlFragment != null && !expectedUrlFragment.isEmpty()) {
            testEmail = email.replace("@", System.currentTimeMillis() + "@");
        }

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.name("name"))).sendKeys(name);
        slow(800);

        driver.findElement(By.name("email")).sendKeys(testEmail);
        slow(800);

        driver.findElement(By.name("password")).sendKeys(password);
        slow(800);

        driver.findElement(By.name("confirmPassword")).sendKeys(confirmPassword);
        slow(800);

        new Select(driver.findElement(By.name("role"))).selectByValue(role);
        slow(1000);

        if (role.equals("student")) {
            driver.findElement(By.name("studentId")).sendKeys(studentId);
            slow(800);

            new Select(driver.findElement(By.name("department"))).selectByVisibleText(department);
            slow(800);

            new Select(driver.findElement(By.name("semester"))).selectByVisibleText(semester);
            slow(800);

            Select batchSelect = new Select(driver.findElement(By.name("batch")));
            if (batchSelect.getOptions().size() > 1) {
                batchSelect.selectByIndex(1);
            }
            slow(800);
        }

        driver.findElement(By.cssSelector("button[type='submit']")).click();
        slow(2000);

        // -------- OTP HANDLING (FINAL FIX) --------
        if (expectedUrlFragment != null && !expectedUrlFragment.isEmpty()) {

            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("auth-title")));
            slow(1000);

            try {
                // 🔥 Correct locator from your HTML
                WebElement otpInput = wait.until(
                        ExpectedConditions.visibilityOfElementLocated(
                                By.cssSelector("input[maxlength='6']"))
                );

                otpInput.sendKeys("123456");  // Dummy OTP
                slow(1000);

                driver.findElement(By.cssSelector("button[type='submit']")).click();
                slow(2000);

            } catch (Exception e) {
                System.out.println("OTP input not found");
            }

            boolean urlChanged = wait.until(ExpectedConditions.urlContains(expectedUrlFragment));
            Assert.assertTrue(urlChanged, "Registration/OTP flow failed");

        } else if (expectedErrorMsg != null && !expectedErrorMsg.isEmpty()) {

            WebElement errorMsg = wait.until(
                    ExpectedConditions.visibilityOfElementLocated(By.className("error-message")));
            Assert.assertTrue(errorMsg.getText().contains(expectedErrorMsg));
        }
    }
}