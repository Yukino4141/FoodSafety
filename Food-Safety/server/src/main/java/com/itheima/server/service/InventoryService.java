package com.itheima.server.service;

import com.itheima.common.result.PageResult;
import com.itheima.pojo.dto.InventoryDTO;

public interface InventoryService {
    void addInventory(InventoryDTO dto);

    PageResult list(Integer status, Integer page, Integer pageSize);
}
