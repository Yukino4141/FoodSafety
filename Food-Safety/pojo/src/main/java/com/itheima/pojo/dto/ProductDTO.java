package com.itheima.pojo.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class ProductDTO implements Serializable {
    private Long id;
    private String barcode;
    private String name;
    private String image;
    private String jsonIngredients; // 前端传来的配料字符串，如 "水,白砂糖"
}