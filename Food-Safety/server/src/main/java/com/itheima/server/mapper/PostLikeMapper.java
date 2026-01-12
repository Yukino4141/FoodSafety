package com.itheima.server.mapper;

import com.itheima.pojo.entity.PostLike;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface PostLikeMapper {

    @Select("select * from post_like where post_id = #{postId} and user_id = #{userId} limit 1")
    PostLike getByUserAndPost(Long postId, Long userId);

    @Insert("insert into post_like(post_id, user_id, create_time) values(#{postId}, #{userId}, #{createTime})")
    void insert(PostLike like);

    @Delete("delete from post_like where id = #{id}")
    int deleteById(Long id);

    @Select("select count(*) from post_like where post_id = #{postId}")
    Long countByPostId(Long postId);

    @Select("select * from post_like where post_id = #{postId} order by create_time desc")
    List<PostLike> listByPostId(Long postId);
}
