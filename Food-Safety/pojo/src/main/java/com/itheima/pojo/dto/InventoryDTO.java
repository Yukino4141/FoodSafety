package com.itheima.pojo.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDate;

@Data
public class InventoryDTO implements Serializable {
    private Long productId;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate purchaseDate;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expiryDate;
}
