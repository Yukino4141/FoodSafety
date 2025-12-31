package com.itheima.common.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "food-safety.ai")
@Data
public class AiProperties {
    /**
     * Chat/分析接口基础地址，例如 https://api.siliconflow.cn/v1/chat/completions
     */
    private String apiUrl;

    /**
     * 调用大模型的密钥
     */
    private String apiKey;

    /**
     * 使用的模型名称，默认 deepseek-chat
     */
    private String model;

    /**
     * OCR 接口地址，例如 https://gjbsb.market.alicloudapi.com/ocrservice/advanced
     */
    private String ocrUrl;

    /**
     * 阿里云 API 网关的 APPCODE
     */
    private String ocrAppCode;
}
