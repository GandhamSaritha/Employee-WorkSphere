package com.spring.empportal.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spring.empportal.model.Employee;
@Repository
public interface EmployeeRepo extends JpaRepository<Employee, Integer>{

}
