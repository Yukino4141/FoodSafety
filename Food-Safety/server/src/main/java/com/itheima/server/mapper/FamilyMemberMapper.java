package com.itheima.server.mapper;

import com.itheima.pojo.entity.FamilyMember;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface FamilyMemberMapper {
    void insert(FamilyMember member);

    List<FamilyMember> listByUserId(Long userId);

    @org.apache.ibatis.annotations.Select("select * from family_member where id = #{id} and user_id = #{userId} limit 1")
    FamilyMember getByIdAndUser(Long id, Long userId);

    @org.apache.ibatis.annotations.Update("update family_member set name = #{name}, age = #{age}, health_tags = #{healthTags} where id = #{id} and user_id = #{userId}")
    int update(FamilyMember member);

    @org.apache.ibatis.annotations.Delete("delete from family_member where id = #{id} and user_id = #{userId}")
    int deleteByIdAndUser(Long id, Long userId);
}
