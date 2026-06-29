package br.com.qa.tests;

import br.com.qa.client.DogApiClient;
import io.qameta.allure.DisplayName;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.restassured.response.Response;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@Epic("Dog API")
@Feature("Consultas de racas e imagens")
class DogApiTest {

    private final DogApiClient dogApiClient = new DogApiClient();

    @Test
    @DisplayName("Deve listar todas as racas disponiveis")
    void shouldListAllAvailableBreeds() {
        Response response = dogApiClient.getAllBreeds();

        Map<String, List<String>> breeds = response.jsonPath().getMap("message");

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.jsonPath().getString("status")).isEqualTo("success");
        assertThat(breeds).isNotNull();
        assertThat(breeds).isNotEmpty();
        assertThat(breeds.keySet()).containsAnyOf("hound", "retriever", "bulldog");
    }

    @Test
    @DisplayName("Deve consultar imagens de uma raca valida")
    void shouldGetImagesByValidBreed() {
        Response response = dogApiClient.getImagesByBreed("hound");

        List<String> images = response.jsonPath().getList("message", String.class);

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.jsonPath().getString("status")).isEqualTo("success");
        assertThat(images).isNotNull();
        assertThat(images).isNotEmpty();
        assertThat(images.get(0))
                .startsWith("https://")
                .contains("images.dog.ceo");
    }

    @Test
    @DisplayName("Deve consultar uma imagem aleatoria")
    void shouldGetRandomImage() {
        Response response = dogApiClient.getRandomImage();

        String imageUrl = response.jsonPath().getString("message");

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.jsonPath().getString("status")).isEqualTo("success");
        assertThat(imageUrl).isNotBlank();
        assertThat(imageUrl)
                .startsWith("https://")
                .contains("images.dog.ceo");
    }

    @Test
    @DisplayName("Deve retornar erro ao consultar imagens de uma raca inexistente")
    void shouldReturnErrorWhenBreedDoesNotExist() {
        Response response = dogApiClient.getImagesByBreed("racainexistenteqa");

        String errorMessage = response.jsonPath().getString("message");

        assertThat(response.statusCode()).isEqualTo(404);
        assertThat(response.jsonPath().getString("status")).isEqualTo("error");
        assertThat(errorMessage).isNotBlank();
        assertThat(errorMessage.toLowerCase()).containsAnyOf("not found", "breed");
    }
}
