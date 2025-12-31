package com.itheima.pojo.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItemVO implements Serializable {
    private Long id;
    private Long productId;
    private String productName;
    private String image;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expiryDate;
    private Integer remainingDays;
    private Integer status;
    private String statusMsg;
}
