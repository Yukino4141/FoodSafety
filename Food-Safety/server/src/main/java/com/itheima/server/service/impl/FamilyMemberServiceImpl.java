package com.itheima.server.service.impl;

import com.alibaba.fastjson.JSON;
import com.itheima.common.context.BaseContext;
import com.itheima.pojo.dto.FamilyMemberDTO;
import com.itheima.pojo.entity.FamilyMember;
import com.itheima.pojo.vo.FamilyMemberVO;
import com.itheima.server.mapper.FamilyMemberMapper;
import com.itheima.server.service.FamilyMemberService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Slf4j
public class FamilyMemberServiceImpl implements FamilyMemberService {

    @Autowired
    private FamilyMemberMapper familyMemberMapper;

    @Override
    public void addMember(FamilyMemberDTO dto) {
        Long userId = BaseContext.getCurrentId();
        FamilyMember member = FamilyMember.builder()
                .userId(userId)
                .name(dto.getName())
                .age(dto.getAge())
                .healthTags(dto.getHealthTags() == null ? null : JSON.toJSONString(dto.getHealthTags()))
                .createTime(LocalDateTime.now())
                .build();
        familyMemberMapper.insert(member);
        log.info("新增家庭成员，用户:{}, 成员:{}", userId, dto.getName());
    }

    @Override
    public java.util.List<FamilyMemberVO> listMembers() {
        Long userId = BaseContext.getCurrentId();
        return familyMemberMapper.listByUserId(userId).stream()
                .map(member -> FamilyMemberVO.builder()
                        .id(member.getId())
                        .userId(member.getUserId())
                        .name(member.getName())
                        .age(member.getAge())
                        .healthTags(parseList(member.getHealthTags()))
                        .createTime(member.getCreateTime())
                        .build())
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    public void updateMember(Long id, FamilyMemberDTO dto) {
        Long userId = BaseContext.getCurrentId();
        FamilyMember existing = familyMemberMapper.getByIdAndUser(id, userId);
        if (existing == null) {
            throw new RuntimeException("成员不存在或无权限");
        }
        existing.setName(dto.getName());
        existing.setAge(dto.getAge());
        existing.setHealthTags(dto.getHealthTags() == null ? null : JSON.toJSONString(dto.getHealthTags()));
        int rows = familyMemberMapper.update(existing);
        if (rows == 0) {
            throw new RuntimeException("更新失败");
        }
    }

    @Override
    public void deleteMember(Long id) {
        Long userId = BaseContext.getCurrentId();
        int rows = familyMemberMapper.deleteByIdAndUser(id, userId);
        if (rows == 0) {
            throw new RuntimeException("成员不存在或无权限");
        }
    }

    private java.util.List<String> parseList(String json) {
        if (json == null || json.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return JSON.parseArray(json, String.class);
    }
}
