// 创建配置类来确保属性类被加载
package com.itheima.server.config;

import com.itheima.common.properties.JwtProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(JwtProperties.class)

public class PropertiesConfig {
}
