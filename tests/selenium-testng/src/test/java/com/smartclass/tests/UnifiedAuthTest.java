package com.smartclass.tests;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.*;
import org.testng.Assert;
import org.testng.annotations.*;

import java.time.Duration;

public class UnifiedAuthTest {
    protected WebDriver driver;
    protected final String BASE_URL = "http://localhost:5173";

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

    public void slow(int millis) {
        // Increased delay for better visibility
        try { Thread.sleep(millis + 1000); } catch (InterruptedException e) { e.printStackTrace(); }
    }

    @DataProvider(name = "featureTestData")
    public Object[][] getFeatureTestData() {
        return new Object[][] {
            // scenario, email, password, role, failPhase
            { "Full Success Scenario (Teacher)", "keshavgarg11911@gmail.com", "Keshav@119", "teacher", "none" },
            { "Student QR Success Scenario", "kgarg2_be23@thapar.edu", "Keshavgarg@119", "student", "none" },
            { "Login Failure Scenario", "keshavgarg11911@gmail.com", "WrongPass@123", "teacher", "login" },
            { "AI Feature Failure Scenario", "keshavgarg11911@gmail.com", "Keshav@119", "teacher", "ai" }
        };
    }

    @Test(dataProvider = "featureTestData")
    public void testProjectFeatures(String scenario, String email, String password, String role, String failPhase) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        System.out.println("\n>>> STARTING: " + scenario);

        try {
            // --- FEATURE 1: REGISTRATION PAGE ---
            System.out.println("Testing Registration Page...");
            driver.get(BASE_URL + "/register");
            slow(1500);
            WebElement regTitle = wait.until(ExpectedConditions.visibilityOfElementLocated(By.tagName("h1")));
            Assert.assertTrue(regTitle.getText().toLowerCase().contains("register") || regTitle.getText().toLowerCase().contains("create"), 
                "Registration page title mismatch");
            
            // --- FEATURE 2: LOGIN PAGE ---
            System.out.println("Testing Login Page...");
            driver.get(BASE_URL + "/login");
            slow(1500);
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.name("email"))).sendKeys(email);
            slow(500);
            driver.findElement(By.name("password")).sendKeys(password);
            slow(500);
            driver.findElement(By.className("auth-btn")).click();
            slow(3000);

            if (failPhase.equals("login")) {
                System.out.println("Intentional Login Failure triggered.");
                try {
                    WebElement errorMsg = wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("error-badge")));
                    Assert.assertTrue(errorMsg.isDisplayed(), "Login error message should be displayed");
                } catch (Exception e) {}
                Assert.fail("Intentional Failure: Login Phase");
            }

            // Verify successful login
            wait.until(ExpectedConditions.urlContains("/dashboard"));
            Assert.assertTrue(driver.getCurrentUrl().contains("/dashboard"), "Login failed - not redirected to dashboard");
            slow(2000);

            // --- FEATURE 3: AI FEATURE OR STUDENT QR SCAN ---
            if (role.equals("teacher")) {
                System.out.println("Testing AI Feature...");
                driver.get(BASE_URL + "/teacher/mark-attendance");
                slow(2000);
                
                // Switch to Face Recognition AI tab
                WebElement aiTab = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(text(), 'Face Recognition AI')]")));
                aiTab.click();
                slow(2000);

                // Verify AI component button presence
                WebElement captureBtn = wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//button[contains(., 'Capture')]")));
                Assert.assertTrue(captureBtn.isDisplayed(), "AI Capture button not found on Face Recognition tab");

                if (failPhase.equals("ai")) {
                    System.out.println("Intentional AI Feature Failure triggered.");
                    Assert.fail("Intentional Failure: AI Feature Phase");
                }

                // --- FEATURE 4: MANUAL ATTENDANCE MARKING ---
                if (scenario.contains("Teacher")) {
                    System.out.println("Testing Manual Attendance Marking...");
                    // Switch back to Manual Entry tab
                    driver.findElement(By.xpath("//button[contains(text(), 'Manual Entry')]")).click();
                    slow(2000);

                    // Select a subject
                    Select subjectSelect = new Select(driver.findElement(By.className("form-select")));
                    subjectSelect.selectByIndex(1); // Select first available subject
                    slow(2000);

                    // Find a student and mark as present
                    try {
                        WebElement firstPresentRadio = driver.findElement(By.cssSelector("input[type='radio'][value='present']"));
                        if (!firstPresentRadio.isSelected()) {
                            firstPresentRadio.click();
                        }
                        slow(1500);
                    } catch (Exception e) {
                        System.out.println("No students found in the manual list to mark.");
                    }

                    // Click Save Attendance
                    WebElement saveBtn = driver.findElement(By.xpath("//button[contains(., 'Save Attendance')]"));
                    saveBtn.click();
                    slow(4000);

                    // Verify success message or redirection
                    wait.until(ExpectedConditions.urlContains("dashboard"));
                    System.out.println("Manual Attendance marked successfully!");
                }
            } else if (role.equals("student")) {
                // --- FEATURE 5: STUDENT QR SCAN ---
                System.out.println("Testing Student QR Scan Feature...");
                driver.get(BASE_URL + "/student/scan-qr");
                slow(3000);

                // Check if 'Enter Token' mode is visible
                WebElement manualTab = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(., 'Enter Token')]")));
                manualTab.click();
                slow(2000);

                // Enter a dummy token
                WebElement tokenArea = driver.findElement(By.tagName("textarea"));
                tokenArea.sendKeys("TEST-TOKEN-12345");
                slow(2000);

                // Click Mark Attendance
                WebElement submitBtn = driver.findElement(By.xpath("//button[contains(., 'Mark Attendance')]"));
                submitBtn.click();
                slow(4000);

                // Note: We don't necessarily expect success with a dummy token, but we verify the attempt
                System.out.println("Student QR Scan attempt completed.");
            }
            
            System.out.println(">>> PASSED: " + scenario);

        } catch (Throwable e) {
            if (e instanceof AssertionError) {
                System.out.println(">>> FAILED AS EXPECTED: " + scenario + " - " + e.getMessage());
                throw (AssertionError) e;
            } else {
                System.out.println(">>> UNEXPECTED ERROR: " + scenario + " - " + e.getMessage());
                Assert.fail("Unexpected error in " + scenario + ": " + e.getMessage());
            }
        }
    }

}