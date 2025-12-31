package com.itheima.server.mapper;

import com.itheima.pojo.entity.UserPoints;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserPointsMapper {
    void insert(UserPoints record);
}
