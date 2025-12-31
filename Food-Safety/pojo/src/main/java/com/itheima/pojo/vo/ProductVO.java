package com.itheima.pojo.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVO implements Serializable {
    // 基础信息
    private Long id;
    private String barcode;
    private String name;
    private String image;
    private String shelfLife;
    private String manufacturer;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;

    // 配料展示
    private List<String> ingredientList; // 将 JSON 转为 List 给前端渲染标签
    private Object nutritionInfo;        // Map 或 JSON 展示营养成分

    // 风险预警 (前端据此显示红色/绿色)
    private String safetyStatus; // 枚举值: "SAFE" 或 "RISK"
    private String riskMsg;      // 例如: "检测到反式脂肪酸"
    private Integer riskLevel;   // 0/1/2

    // 互动字段
    private Boolean isFavorite;  // 是否已收藏
}