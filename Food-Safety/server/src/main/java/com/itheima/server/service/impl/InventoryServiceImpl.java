package com.itheima.server.service.impl;

import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.itheima.common.context.BaseContext;
import com.itheima.common.result.PageResult;
import com.itheima.pojo.dto.InventoryDTO;
import com.itheima.pojo.entity.Product;
import com.itheima.pojo.entity.ProductInventory;
import com.itheima.pojo.vo.InventoryItemVO;
import com.itheima.server.mapper.ProductInventoryMapper;
import com.itheima.server.mapper.ProductMapper;
import com.itheima.server.service.InventoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class InventoryServiceImpl implements InventoryService {

    @Autowired
    private ProductInventoryMapper productInventoryMapper;

    @Autowired
    private ProductMapper productMapper;

    @Override
    public void addInventory(InventoryDTO dto) {
        Long userId = BaseContext.getCurrentId(); // 获取当前用户ID
        
        ProductInventory inventory = ProductInventory.builder()
                .userId(userId)
                .productId(dto.getProductId())
                .purchaseDate(dto.getPurchaseDate())
                .expiryDate(dto.getExpiryDate())
                .status(1)
                .createTime(LocalDateTime.now())
                .build();
        productInventoryMapper.insert(inventory);
    }

    @Override
    public PageResult list(Integer status, Integer page, Integer pageSize) {
        Long userId = BaseContext.getCurrentId(); // 获取当前用户ID

        PageHelper.startPage(page, pageSize);
        Page<ProductInventory> pageData = (Page<ProductInventory>) productInventoryMapper.listByUserId(userId);

        LocalDate today = LocalDate.now();
        List<InventoryItemVO> items = pageData.getResult().stream()
                .map(record -> {
                    Product product = productMapper.getById(record.getProductId());
                    if (product == null) {
                        return null;
                    }
                    int remaining = (int) ChronoUnit.DAYS.between(today, record.getExpiryDate());
                    int computedStatus;
                    if (remaining < 0) {
                        computedStatus = 3;
                    } else if (remaining < 7) {
                        computedStatus = 2;
                    } else {
                        computedStatus = 1;
                    }
                    if (record.getStatus() == null || !record.getStatus().equals(computedStatus)) {
                        record.setStatus(computedStatus);
                        productInventoryMapper.updateStatus(record);
                    }
                    String statusMsg = computedStatus == 1 ? "正常" : computedStatus == 2 ? "请尽快食用" : computedStatus == 3 ? "已过期" : "已消耗";
                    return InventoryItemVO.builder()
                            .id(record.getId())
                            .productId(record.getProductId())
                            .productName(product.getName())
                            .image(product.getImage())
                            .purchaseDate(record.getPurchaseDate())
                            .expiryDate(record.getExpiryDate())
                            .remainingDays(remaining)
                            .status(computedStatus)
                            .statusMsg(statusMsg)
                            .build();
                })
                .filter(vo -> vo != null)
                .filter(vo -> status == null || status == 0 || vo.getStatus().equals(status))
                .collect(Collectors.toList());

        return new PageResult(pageData.getTotal(), items);
    }
}
