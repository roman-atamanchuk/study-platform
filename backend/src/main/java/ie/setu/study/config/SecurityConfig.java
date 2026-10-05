package ie.setu.study.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .securityContext(context -> context.securityContextRepository(securityContextRepository()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/health",
                    "/actuator/health",
                    "/auth/register",
                    "/auth/login",
                    "/auth/forgot-password",
                    "/auth/reset-password",
                    "/public-library",
                    "/programmes",
                    "/programmes/**",
                    "/courses/search",
                    "/courses/*/icon",
                    "/courses/*/material-board",
                    "/courses/*"
                ).permitAll()
                .requestMatchers(HttpMethod.GET, "/share-links/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/materials/*/view", "/materials/*/download").permitAll()
                .anyRequest().authenticated()
            );

        return http.build();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
