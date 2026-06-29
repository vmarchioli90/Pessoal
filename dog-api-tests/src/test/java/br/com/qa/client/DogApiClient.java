package br.com.qa.client;

import br.com.qa.config.ApiConfig;
import io.restassured.response.Response;

public class DogApiClient {

    public Response getAllBreeds() {
        return ApiConfig.requestSpec()
                .when()
                .get("/breeds/list/all");
    }

    public Response getImagesByBreed(String breed) {
        return ApiConfig.requestSpec()
                .pathParam("breed", breed)
                .when()
                .get("/breed/{breed}/images");
    }

    public Response getRandomImage() {
        return ApiConfig.requestSpec()
                .when()
                .get("/breeds/image/random");
    }
}
