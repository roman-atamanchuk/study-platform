package ie.setu.study;

import ie.setu.study.config.AiProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AiProperties.class)
public class StudyPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(StudyPlatformApplication.class, args);
    }
}
