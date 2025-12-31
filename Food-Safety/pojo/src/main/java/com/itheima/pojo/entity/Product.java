package com.itheima.pojo.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product implements Serializable {
    private Long id;
    private String barcode; // 条形码
    private String name;    // 商品名称
    private String image;   // 图片路径
    private String jsonIngredients; // 配料表，逗号分隔
    private Integer riskLevel;      // 0:安全 1:中风险 2:高风险
    private String riskMsg;         // 风险提示信息
    private String nutritionInfo;   // 营养成分(JSON字符串)
    private String shelfLife;       // 保质期
    private String manufacturer;    // 生产厂商
    private String ocrRawText;      // OCR原文
    private Long createUser;        // 录入人ID
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;
}