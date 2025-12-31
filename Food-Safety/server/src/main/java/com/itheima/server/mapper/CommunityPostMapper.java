package com.itheima.server.mapper;

import com.itheima.pojo.entity.CommunityPost;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface CommunityPostMapper {
    void insert(CommunityPost post);

    List<CommunityPost> listLatest();

    List<CommunityPost> listHot();

    CommunityPost getById(Long id);

    void updateLikeCount(Long id, Integer likeCount);
}
