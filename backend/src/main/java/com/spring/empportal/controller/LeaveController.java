package com.spring.empportal.controller;

import com.spring.empportal.model.LeaveReques;
import com.spring.empportal.model.User;
import com.spring.empportal.repo.LeaveRequestRepo;
import com.spring.empportal.repo.UserRepo;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/leaves")
public class LeaveController {

    private final LeaveRequestRepo leaveRepo;
    private final UserRepo userRepo;

    public LeaveController(LeaveRequestRepo leaveRepo, UserRepo userRepo) {
        this.leaveRepo = leaveRepo;
        this.userRepo = userRepo;
    }

    @PostMapping
    public ResponseEntity<?> apply(
            @RequestBody Map<String, String> data,
            Authentication authentication) {

        try {
            User user = userRepo.findByUsername(authentication.getName())
                    .orElseThrow();

            LocalDate start = LocalDate.parse(data.get("startDate"));
            LocalDate end = LocalDate.parse(data.get("endDate"));
            String reason = data.getOrDefault("reason", "").trim();

            if (start.isBefore(LocalDate.now()) || end.isBefore(start)) {
                return ResponseEntity.badRequest().body(
                    Map.of("message", "Choose valid future dates.")
                );
            }

            if (reason.isBlank() || reason.length() > 500) {
                return ResponseEntity.badRequest().body(
                    Map.of("message", "Enter a reason of up to 500 characters.")
                );
            }

            LeaveReques leave = new LeaveReques();
            leave.setUserId(user.getId());
            leave.setStartDate(start);
            leave.setEndDate(end);
            leave.setReason(reason);
            leave.setStatus("PENDING");

            return ResponseEntity.ok(leaveRepo.save(leave));

        } catch (Exception exception) {
            return ResponseEntity.badRequest().body(
                Map.of("message", "Please enter valid leave details.")
            );
        }
    }

    @GetMapping("/my")
    public List<LeaveReques> myLeaves(Authentication authentication) {
        User user = userRepo.findByUsername(authentication.getName())
                .orElseThrow();

        return leaveRepo.findByUserIdOrderBySubmittedAtDesc(user.getId());
    }
}