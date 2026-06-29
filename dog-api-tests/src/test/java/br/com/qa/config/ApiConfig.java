package br.com.qa.config;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.specification.RequestSpecification;

public final class ApiConfig {

    public static final String BASE_URL = "https://dog.ceo/api";

    private ApiConfig() {
    }

    public static RequestSpecification requestSpec() {
        return RestAssured
                .given()
                .baseUri(BASE_URL)
                .contentType(ContentType.JSON)
                .accept(ContentType.JSON);
    }
}
