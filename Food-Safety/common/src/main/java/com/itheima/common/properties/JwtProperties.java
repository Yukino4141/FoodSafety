package com.itheima.common.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;


@Component
@ConfigurationProperties(prefix = "food-safety.jwt")
@Data

public class JwtProperties {
    // 管理端
    private String adminSecretKey;
    private long adminTtl;
    private String adminTokenName;

    // 用户端
    private String userSecretKey;
    private long userTtl;
    private String userTokenName;
}