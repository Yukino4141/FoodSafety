package com.itheima.server.controller.user;

import com.itheima.common.result.PageResult;
import com.itheima.common.result.Result;
import com.itheima.pojo.dto.InventoryDTO;
import com.itheima.server.service.InventoryService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/user/inventory")
@Api(tags = "C端-库存与保质期")
@Slf4j
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @PostMapping
    @ApiOperation("添加商品到库存")
    public Result<String> add(@RequestBody InventoryDTO dto) {
        inventoryService.addInventory(dto);
        return Result.success("success");
    }

    @GetMapping("/list")
    @ApiOperation("查询库存列表")
    public Result<PageResult> list(@RequestParam(required = false) Integer status,
                                   @RequestParam(defaultValue = "1") Integer page,
                                   @RequestParam(defaultValue = "10") Integer pageSize) {
        PageResult pageResult = inventoryService.list(status, page, pageSize);
        return Result.success(pageResult);
    }
}
