package com.itheima.common.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 微信小程序配置属性
 */
@Component
@ConfigurationProperties(prefix = "food-safety.wechat")
@Data
public class WeChatProperties {
    private String appid;      // 小程序appid
    private String secret;     // 小程序secret
}
