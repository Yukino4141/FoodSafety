package com.itheima.server.mapper;

import com.itheima.pojo.entity.ScanHistory;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 扫描历史 Mapper 接口
 */
@Mapper
public interface ScanHistoryMapper {

    /**
     * 插入扫描历史记录
     * @param scanHistory 扫描历史实体
     */
    @Insert("INSERT INTO scan_history (user_id, product_id, scan_time) " +
            "VALUES (#{userId}, #{productId}, #{scanTime})")
    void insert(ScanHistory scanHistory);

    /**
     * 根据用户ID查询扫描历史（按时间倒序）
     * @param userId 用户ID
     * @return 扫描历史列表
     */
    @Select("SELECT * FROM scan_history WHERE user_id = #{userId} " +
            "ORDER BY scan_time DESC")
    List<ScanHistory> listByUserId(Long userId);

    /**
     * 根据 ID 删除扫描历史
     * @param id 历史记录ID
     */
    void deleteById(Long id);

    /**
     * 清空用户的所有扫描历史
     * @param userId 用户ID
     */
    void deleteByUserId(Long userId);
    
    /**
     * 获取今日扫码数
     * @return 今日扫码数
     */
    @Select("SELECT COUNT(*) FROM scan_history WHERE DATE(scan_time) = CURRENT_DATE")
    Integer getTodayScans();
}
