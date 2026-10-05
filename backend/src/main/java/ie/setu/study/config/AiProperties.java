package ie.setu.study.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.ai")
public record AiProperties(
    String openaiApiKey,
    String openaiModel,
    String openaiBaseUrl,
    String deepseekApiKey,
    String deepseekModel,
    String deepseekBaseUrl
) {}
