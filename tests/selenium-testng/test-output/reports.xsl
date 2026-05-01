<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:template match="/">
<html>
<head>
    <title>TestNG XSLT Report</title>
    <style>
        body { font-family: Arial; }
        table { border-collapse: collapse; width: 80%; margin: 20px; }
        th, td { border: 1px solid black; padding: 8px; text-align: center; }
        th { background-color: #4CAF50; color: white; }
    </style>
</head>

<body>
    <h2>TestNG Report</h2>

    <table>
        <tr>
            <th>Total</th>
            <th>Passed</th>
            <th>Failed</th>
            <th>Skipped</th>
        </tr>

        <tr>
            <td><xsl:value-of select="testng-results/@total"/></td>
            <td><xsl:value-of select="testng-results/@passed"/></td>
            <td><xsl:value-of select="testng-results/@failed"/></td>
            <td><xsl:value-of select="testng-results/@skipped"/></td>
        </tr>
    </table>
    <h3>Detailed Results</h3>
    <table>
        <tr>
            <th>Test Method</th>
            <th>Status</th>
            <th>Duration (ms)</th>
            <th>Details</th>
        </tr>
        <xsl:for-each select="//test-method[not(@is-config='true')]">
        <tr>
            <td><xsl:value-of select="@name"/></td>
            <td>
                <xsl:attribute name="style">
                    <xsl:choose>
                        <xsl:when test="@status='PASS'">color: green; font-weight: bold;</xsl:when>
                        <xsl:when test="@status='FAIL'">color: red; font-weight: bold;</xsl:when>
                        <xsl:otherwise>color: orange;</xsl:otherwise>
                    </xsl:choose>
                </xsl:attribute>
                <xsl:value-of select="@status"/>
            </td>
            <td><xsl:value-of select="@duration-ms"/></td>
            <td style="text-align: left; font-size: 0.8em;">
                <xsl:value-of select="exception/message"/>
            </td>
        </tr>
        </xsl:for-each>
    </table>

</body>
</html>
</xsl:template>

</xsl:stylesheet>