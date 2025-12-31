package com.itheima.server.service.impl;

import com.alibaba.fastjson.JSON;
import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.itheima.common.context.BaseContext;
import com.itheima.common.result.PageResult;
import com.itheima.pojo.dto.LikeDTO;
import com.itheima.pojo.dto.PostDTO;
import com.itheima.pojo.entity.CommunityPost;
import com.itheima.pojo.vo.PostVO;
import com.itheima.server.mapper.CommunityPostMapper;
import com.itheima.server.mapper.UserPointsMapper;
import com.itheima.server.service.CommunityService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class CommunityServiceImpl implements CommunityService {

    @Autowired
    private CommunityPostMapper communityPostMapper;

    @Autowired
    private UserPointsMapper userPointsMapper;

    @Override
    public void publish(PostDTO dto) {
        Long userId = BaseContext.getCurrentId();
        CommunityPost post = CommunityPost.builder()
                .userId(userId)
                .title(dto.getTitle())
                .content(dto.getContent())
                .images(dto.getImages() == null ? null : JSON.toJSONString(dto.getImages()))
                .likeCount(0)
                .viewCount(0)
                .createTime(LocalDateTime.now())
                .build();
        communityPostMapper.insert(post);
    }

    @Override
    public PageResult feed(Integer page, Integer pageSize, String sort) {
        PageHelper.startPage(page, pageSize);
        List<CommunityPost> raw;
        if ("hot".equalsIgnoreCase(sort)) {
            raw = communityPostMapper.listHot();
        } else {
            raw = communityPostMapper.listLatest();
        }
        Page<CommunityPost> p = (Page<CommunityPost>) raw;
        List<PostVO> records = p.getResult().stream()
                .map(this::toVO)
                .collect(Collectors.toList());
        return new PageResult(p.getTotal(), records);
    }

    @Override
    public void like(LikeDTO dto) {
        CommunityPost post = communityPostMapper.getById(dto.getPostId());
        if (post == null) {
            throw new RuntimeException("帖子不存在");
        }
        int likeCount = post.getLikeCount() == null ? 0 : post.getLikeCount();
        if (Boolean.TRUE.equals(dto.getIsLike())) {
            likeCount += 1;
        } else if (likeCount > 0) {
            likeCount -= 1;
        }
        communityPostMapper.updateLikeCount(dto.getPostId(), likeCount);
    }

    private PostVO toVO(CommunityPost post) {
        PostVO vo = new PostVO();
        BeanUtils.copyProperties(post, vo);
        vo.setImages(post.getImages() == null ? null : JSON.parseArray(post.getImages(), String.class));
        return vo;
    }
}
