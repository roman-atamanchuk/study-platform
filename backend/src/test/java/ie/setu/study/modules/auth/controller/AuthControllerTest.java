package ie.setu.study.modules.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import ie.setu.study.modules.auth.dto.LoginRequest;
import ie.setu.study.modules.auth.dto.RegisterRequest;
import ie.setu.study.modules.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Test
    void registerLoginAndMeFlowWorks() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
            "Jane",
            "Doe",
            "20231234@setu.ie",
            "20231234",
            "Password1",
            null,
            null
        );

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.email").value("20231234@setu.ie"))
            .andExpect(jsonPath("$.role").value("USER"));

        LoginRequest loginRequest = new LoginRequest("20231234@setu.ie", "Password1");

        MvcResult loginResult = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.firstName").value("Jane"))
            .andReturn();

        MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession(false);
        assertThat(session).isNotNull();

        mockMvc.perform(get("/auth/me").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.studentNumber").value("20231234"));

        mockMvc.perform(post("/auth/logout").session(session))
            .andExpect(status().isNoContent());
    }

    @Test
    void forgotPasswordThenResetAllowsLoginWithNewPassword() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
            "Reset",
            "User",
            "20115555@setu.ie",
            "20115555",
            "Password1",
            null,
            null
        );

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
            .andExpect(status().isCreated());

        MvcResult forgotResult = mockMvc.perform(post("/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"20115555@setu.ie\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resetToken").isNotEmpty())
            .andReturn();

        String token = objectMapper.readTree(forgotResult.getResponse().getContentAsString())
            .path("resetToken")
            .asText();

        mockMvc.perform(post("/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"" + token + "\",\"password\":\"Password2\"}"))
            .andExpect(status().isNoContent());

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"20115555@setu.ie\",\"password\":\"Password2\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("20115555@setu.ie"));
    }

    @Test
    void duplicateEmailIsRejected() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
            "Jane",
            "Doe",
            "20239999@setu.ie",
            "20239999",
            "Password1",
            null,
            null
        );

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
            .andExpect(status().isCreated());

        RegisterRequest duplicate = new RegisterRequest(
            "John",
            "Smith",
            "20239999@setu.ie",
            "20238888",
            "Password1",
            null,
            null
        );

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicate)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_EXISTS"));
    }
}
