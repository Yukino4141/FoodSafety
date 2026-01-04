package com.itheima.server.mapper;

import com.itheima.pojo.entity.Employee;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface EmployeeMapper {

    /**
     * 根据ID查询员工
     */
    Employee getById(Long id);

    /**
     * 根据用户名查询员工
     */
    Employee getByUsername(String username);

    /**
     * 查询所有员工
     */
    List<Employee> listAll();

    /**
     * 新增员工
     */
    int insert(Employee employee);

    /**
     * 更新员工
     */
    int update(Employee employee);

    /**
     * 根据ID删除员工
     */
    int deleteById(Long id);
}