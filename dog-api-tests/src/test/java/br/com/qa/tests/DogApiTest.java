package br.com.qa.tests;

import br.com.qa.client.DogApiClient;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.restassured.response.Response;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static io.restassured.module.jsv.JsonSchemaValidator.matchesJsonSchemaInClasspath;

@Epic("Dog API")
@Feature("Consultas de raças e imagens")
class DogApiTest {

    private final DogApiClient dogApiClient = new DogApiClient();

    @Test
    @DisplayName("Deve listar todas as raças disponíveis")
    void shouldListAllAvailableBreeds() {
        Response response = dogApiClient.getAllBreeds();

        assertThat(response.statusCode()).isEqualTo(200);
        response.then().body(matchesJsonSchemaInClasspath("schemas/breeds-list-success.schema.json"));

        Map<String, List<String>> breeds = response.jsonPath().getMap("message");

        assertThat(response.jsonPath().getString("status")).isEqualTo("success");
        assertThat(breeds).isNotNull();
        assertThat(breeds).isNotEmpty();
        assertThat(breeds.keySet()).containsAnyOf("hound", "retriever", "bulldog");
    }

    @Test
    @DisplayName("Deve consultar imagens de uma raça válida")
    void shouldGetImagesByValidBreed() {
        Response response = dogApiClient.getImagesByBreed("hound");

        assertThat(response.statusCode()).isEqualTo(200);
        response.then().body(matchesJsonSchemaInClasspath("schemas/breed-images-success.schema.json"));

        List<String> images = response.jsonPath().getList("message", String.class);

        assertThat(response.jsonPath().getString("status")).isEqualTo("success");
        assertThat(images).isNotNull();
        assertThat(images).isNotEmpty();
        assertThat(images.get(0))
                .startsWith("https://")
                .contains("images.dog.ceo");
    }

    @Test
    @DisplayName("Deve consultar uma imagem aleatória")
    void shouldGetRandomImage() {
        Response response = dogApiClient.getRandomImage();

        assertThat(response.statusCode()).isEqualTo(200);
        response.then().body(matchesJsonSchemaInClasspath("schemas/random-image-success.schema.json"));

        String imageUrl = response.jsonPath().getString("message");

        assertThat(response.jsonPath().getString("status")).isEqualTo("success");
        assertThat(imageUrl).isNotBlank();
        assertThat(imageUrl)
                .startsWith("https://")
                .contains("images.dog.ceo");
    }

    @Test
    @DisplayName("Deve retornar erro ao consultar imagens de uma raça inexistente")
    void shouldReturnErrorWhenBreedDoesNotExist() {
        Response response = dogApiClient.getImagesByBreed("racainexistenteqa");

        assertThat(response.statusCode()).isEqualTo(404);
        response.then().body(matchesJsonSchemaInClasspath("schemas/error-response.schema.json"));

        String errorMessage = response.jsonPath().getString("message");

        assertThat(response.jsonPath().getString("status")).isEqualTo("error");
        assertThat(errorMessage).isNotBlank();
        assertThat(errorMessage.toLowerCase()).containsAnyOf("not found", "breed");
    }
}
