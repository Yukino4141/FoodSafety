package com.itheima.pojo.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * 商品数据传输对象
 * 用于新增和修改商品时的参数接收
 */
@Data
public class ProductDTO {

    // 注意：新增商品时不需要id字段
    // 修改商品时才需要id字段
    private Long id;

    @NotBlank(message = "条形码不能为空")
    @Size(max = 32, message = "条形码长度不能超过32位")
    private String barcode;

    @NotBlank(message = "商品名称不能为空")
    @Size(max = 100, message = "商品名称长度不能超过100位")
    private String name;

    private String image;

    @NotBlank(message = "配料表不能为空")
    private String jsonIngredients;

    // 其他扩展字段（V1.1+）
    private String nutritionInfo;
    private String shelfLife;
    private String manufacturer;
    private String ocrRawText;
}