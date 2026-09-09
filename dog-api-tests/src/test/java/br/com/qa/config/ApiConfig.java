package br.com.qa.config;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.specification.RequestSpecification;

public final class ApiConfig {

    private static final String DEFAULT_BASE_URL = "https://dog.ceo/api";
    private static final String BASE_URL_PROPERTY = "baseUrl";
    private static final String BASE_URL_ENVIRONMENT_VARIABLE = "DOG_API_BASE_URL";

    private ApiConfig() {
    }

    public static RequestSpecification requestSpec() {
        return RestAssured
                .given()
                .baseUri(resolveBaseUrl())
                .contentType(ContentType.JSON)
                .accept(ContentType.JSON);
    }

    private static String resolveBaseUrl() {
        String propertyValue = System.getProperty(BASE_URL_PROPERTY);
        if (propertyValue != null && !propertyValue.isBlank()) {
            return propertyValue.trim();
        }

        String environmentValue = System.getenv(BASE_URL_ENVIRONMENT_VARIABLE);
        if (environmentValue != null && !environmentValue.isBlank()) {
            return environmentValue.trim();
        }

        return DEFAULT_BASE_URL;
    }
}
