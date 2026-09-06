package com.aceinterview.backend;

import com.aceinterview.backend.entity.*;
import com.aceinterview.backend.repository.*;
import com.aceinterview.backend.service.InterviewService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class InterviewDeletionTests {
    @Autowired InterviewService interviews;
    @Autowired UserRepository users;
    @Autowired InterviewSessionRepository sessions;
    @Autowired QuestionRepository questions;
    @Autowired SessionQuestionRepository sessionQuestions;
    @Autowired AnswerRepository answers;
    @Autowired RubricCriterionRepository rubrics;
    @Autowired AnswerRubricScoreRepository rubricScores;
    @Autowired InterviewResultRepository results;

    @Test
    void ownerCanDeleteACompletedSessionAndAllDependentRecords() {
        User owner=createUser("owner");
        InterviewSession session=createSession(owner,"COMPLETED");
        Question question=questions.findByActiveTrue().stream().findFirst().orElseThrow();
        RubricCriterion criterion=rubrics.findByQuestionIdOrderByCriterionOrderAsc(question.getId()).stream().findFirst().orElseThrow();

        SessionQuestion assigned=new SessionQuestion();assigned.setInterviewSession(session);assigned.setQuestion(question);assigned.setQuestionOrder(1);assigned.setSourceType(question.getSourceType());assigned=sessionQuestions.save(assigned);
        Answer answer=new Answer();answer.setInterviewSession(session);answer.setQuestion(question);answer.setAnswerText("A saved answer");answer.setScore(80);answer=answers.save(answer);
        AnswerRubricScore rubricScore=new AnswerRubricScore();rubricScore.setAnswer(answer);rubricScore.setRubricCriterion(criterion);rubricScore.setStatus("FULL");rubricScore.setAwardedPoints(criterion.getWeight());rubricScore.setMaximumPoints(criterion.getWeight());rubricScore=rubricScores.save(rubricScore);
        InterviewResult result=new InterviewResult();result.setInterviewSession(session);result.setOverallScore(80);result=results.save(result);

        interviews.deleteCompletedInterview(owner.getId(),session.getId());

        assertThat(sessions.findById(session.getId())).isEmpty();
        assertThat(sessionQuestions.findById(assigned.getId())).isEmpty();
        assertThat(answers.findById(answer.getId())).isEmpty();
        assertThat(rubricScores.findById(rubricScore.getId())).isEmpty();
        assertThat(results.findById(result.getId())).isEmpty();
    }

    @Test
    void anotherUserCannotDeleteTheSessionAndInProgressSessionsAreProtected() {
        User owner=createUser("owner");
        User other=createUser("other");
        InterviewSession completed=createSession(owner,"COMPLETED");
        InterviewSession inProgress=createSession(owner,"IN_PROGRESS");

        assertThatThrownBy(() -> interviews.deleteCompletedInterview(other.getId(),completed.getId()))
                .hasMessageContaining("Interview session not found");
        assertThatThrownBy(() -> interviews.deleteCompletedInterview(owner.getId(),inProgress.getId()))
                .hasMessageContaining("Only completed interview sessions can be deleted");
        assertThat(sessions.findById(completed.getId())).isPresent();
        assertThat(sessions.findById(inProgress.getId())).isPresent();
    }

    private User createUser(String prefix) {
        User user=new User();user.setName("Deletion Test");user.setEmail(prefix+"-"+UUID.randomUUID()+"@test.local");user.setPasswordHash("not-used");return users.save(user);
    }

    private InterviewSession createSession(User owner,String status) {
        InterviewSession session=new InterviewSession();session.setUser(owner);session.setRole("Software Engineer");session.setInterviewType("Technical");session.setExperienceLevel("Entry (0-2 yrs)");session.setStatus(status);return sessions.save(session);
    }
}
