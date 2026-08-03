package com.curlybraces.repository;

import com.curlybraces.model.Submission;
import com.curlybraces.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Submission> findByUserOrderByCreatedAtDesc(User user);
}