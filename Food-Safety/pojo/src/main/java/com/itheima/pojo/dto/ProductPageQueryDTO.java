package com.itheima.pojo.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class ProductPageQueryDTO implements Serializable {
    private Integer page = 1;
    private Integer pageSize = 10;
    private String barcode;
    private String name;
}