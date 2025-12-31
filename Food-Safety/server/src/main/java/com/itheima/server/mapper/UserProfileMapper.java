package com.itheima.server.mapper;

import com.itheima.pojo.entity.UserProfile;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface UserProfileMapper {

    @Select("SELECT * FROM user_profile WHERE user_id = #{userId} LIMIT 1")
    UserProfile getByUserId(Long userId);

    void insert(UserProfile profile);

    void update(UserProfile profile);
}
