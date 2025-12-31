package com.itheima.server.mapper;

import com.itheima.pojo.entity.FamilyMember;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface FamilyMemberMapper {
    void insert(FamilyMember member);

    List<FamilyMember> listByUserId(Long userId);
}
