package com.itheima.common.result;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 统一分页返回结果
 * @param <T> 数据类型
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResult<T> {
    /**
     * 总记录数
     */
    private Long total;

    /**
     * 当前页数据列表
     */
    private List<T> records;

    /**
     * 当前页码
     */
    private Integer page;

    /**
     * 每页条数
     */
    private Integer pageSize;

    /**
     * 总页数
     */
    private Integer pages;

    /**
     * 构建分页结果（使用PageHelper）
     * @param list 分页查询结果
     * @param page 当前页码
     * @param pageSize 每页条数
     * @return 分页结果
     */
    public static <T> PageResult<T> of(List<T> list, Integer page, Integer pageSize) {
        com.github.pagehelper.Page<T> pageInfo = (com.github.pagehelper.Page<T>) list;

        return PageResult.<T>builder()
                .total(pageInfo.getTotal())
                .records(pageInfo.getResult())
                .page(page)
                .pageSize(pageSize)
                .pages(pageInfo.getPages())
                .build();
    }

    /**
     * 构建分页结果（不使用PageHelper）
     * @param list 当前页数据
     * @param total 总记录数
     * @param page 当前页码
     * @param pageSize 每页条数
     * @return 分页结果
     */
    public static <T> PageResult<T> of(List<T> list, Long total, Integer page, Integer pageSize) {
        int pages = (int) Math.ceil((double) total / pageSize);

        return PageResult.<T>builder()
                .total(total)
                .records(list)
                .page(page)
                .pageSize(pageSize)
                .pages(pages)
                .build();
    }
}