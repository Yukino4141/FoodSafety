package com.itheima.server.mapper;

import com.itheima.pojo.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/**
 * 用户 Mapper 接口
 */
@Mapper
public interface UserMapper {

    /**
     * 根据 openid 查询用户
     * @param openid 微信用户唯一标识
     * @return 用户实体
     */
    @Select("SELECT * FROM user WHERE openid = #{openid}")
    User getByOpenid(String openid);

    /**
     * 插入新用户
     * @param user 用户实体
     */
    void insert(User user);

    /**
     * 根据 ID 查询用户
     * @param id 用户ID
     * @return 用户实体
     */
    @Select("SELECT * FROM user WHERE id = #{id}")
    User getById(Long id);

    /**
     * 更新用户信息
     * @param user 用户实体
     */
    void update(User user);
    
    /**
     * 获取总用户数
     * @return 总用户数
     */
    @Select("SELECT COUNT(*) FROM user")
    Integer getTotalUsers();
}
