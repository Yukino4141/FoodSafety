package com.itheima.common.enumeration;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum RiskLevel {
    SAFE(0, "安全"),
    RISK(1, "中风险/过敏原提醒"),
    DANGER(2, "高风险/非法添加剂");

    private final Integer code;
    private final String description;
}