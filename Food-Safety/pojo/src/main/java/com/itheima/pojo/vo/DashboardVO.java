package com.itheima.pojo.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardVO {
    private Integer totalUsers;
    private Integer todayScans;
    private Integer pendingPosts;
}
