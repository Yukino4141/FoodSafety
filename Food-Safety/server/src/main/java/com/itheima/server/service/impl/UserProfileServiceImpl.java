package com.itheima.server.service.impl;

import com.alibaba.fastjson.JSON;
import com.itheima.common.context.BaseContext;
import com.itheima.pojo.dto.ProfileDTO;
import com.itheima.pojo.entity.UserProfile;
import com.itheima.pojo.vo.ProfileVO;
import com.itheima.server.mapper.UserProfileMapper;
import com.itheima.server.service.UserProfileService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class UserProfileServiceImpl implements UserProfileService {

    @Autowired
    private UserProfileMapper userProfileMapper;

    @Override
    public ProfileVO getProfile() {
        Long userId = BaseContext.getCurrentId();
        UserProfile profile = userProfileMapper.getByUserId(userId);
        return toVO(profile);
    }

    @Override
    public ProfileVO upsertProfile(ProfileDTO dto) {
        Long userId = BaseContext.getCurrentId();
        UserProfile existing = userProfileMapper.getByUserId(userId);

        String allergensJson = dto.getAllergens() == null ? null : JSON.toJSONString(dto.getAllergens());
        String healthTagsJson = dto.getHealthTags() == null ? null : JSON.toJSONString(dto.getHealthTags());

        if (existing == null) {
            UserProfile profile = UserProfile.builder()
                    .userId(userId)
                    .allergens(allergensJson)
                    .dietType(dto.getDietType())
                    .healthTags(healthTagsJson)
                    .updateTime(LocalDateTime.now())
                    .build();
            userProfileMapper.insert(profile);
        } else {
            existing.setAllergens(allergensJson);
            existing.setDietType(dto.getDietType());
            existing.setHealthTags(healthTagsJson);
            existing.setUpdateTime(LocalDateTime.now());
            userProfileMapper.update(existing);
        }
        return getProfile();
    }

    private ProfileVO toVO(UserProfile profile) {
        if (profile == null) {
            return ProfileVO.builder()
                    .allergens(Collections.emptyList())
                    .dietType(null)
                    .healthTags(Collections.emptyList())
                    .build();
        }
        List<String> allergens = parseArray(profile.getAllergens());
        List<String> healthTags = parseArray(profile.getHealthTags());
        return ProfileVO.builder()
                .allergens(allergens)
                .dietType(profile.getDietType())
                .healthTags(healthTags)
                .build();
    }

    private List<String> parseArray(String json) {
        if (json == null || json.isEmpty()) {
            return Collections.emptyList();
        }
        return JSON.parseArray(json, String.class);
    }
}
