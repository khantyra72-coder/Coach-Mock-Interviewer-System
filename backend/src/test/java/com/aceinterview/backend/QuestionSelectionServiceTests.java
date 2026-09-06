package com.aceinterview.backend;

import com.aceinterview.backend.entity.*;
import com.aceinterview.backend.repository.*;
import com.aceinterview.backend.service.QuestionSelectionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import java.util.*;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest @ActiveProfiles("test")
class QuestionSelectionServiceTests {
    @Autowired QuestionSelectionService selector; @Autowired UserRepository users;
    @Autowired TechRoleRepository roles; @Autowired InterviewTypeRepository types; @Autowired CompanyRepository companies;
    @Autowired QuestionRepository questions; @Autowired QuestionHistoryRepository history;
    @Test void selectsOnlyRequestedScopeWithRequiredMixAndBalance(){
        User user=new User();user.setName("Selection Test");user.setEmail("selection@test.local");user.setPasswordHash("not-used");user=users.save(user);
        TechRole role=roles.findByName("Software Engineer").orElseThrow(); InterviewType type=types.findByName("Technical").orElseThrow(); Company company=companies.findByName("Google").orElseThrow();
        List<Question> selected=selector.select(user,role,List.of(type),company,"Medium");
        assertThat(selected).hasSize(15).allMatch(q->q.getTechRole().getId().equals(role.getId())&&q.getInterviewType().getId().equals(type.getId()));
        assertThat(selected.stream().filter(q->q.getCompany()!=null).count()).isEqualTo(3);
        assertThat(selected.stream().filter(q->q.getCompany()==null).count()).isEqualTo(12);
        assertThat(selected.stream().filter(q->q.getCompany()!=null).allMatch(q->q.getCompany().getId().equals(company.getId()))).isTrue();
        Map<String,Long> difficulty=new HashMap<>();Map<String,Long> topics=new HashMap<>();selected.forEach(q->{difficulty.merge(q.getDifficulty(),1L,Long::sum);topics.merge(q.getTopic(),1L,Long::sum);});
        assertThat(difficulty).containsEntry("Easy",4L).containsEntry("Medium",7L).containsEntry("Hard",4L);
        assertThat(topics.values()).allMatch(count->count<=2);
        assertThat(selected.stream().map(Question::getNormalizedText)).doesNotHaveDuplicates();

        List<Question> five=selector.select(user,role,List.of(type),company,"Medium",List.of(),5);
        assertThat(five).hasSize(5).extracting(Question::getNormalizedText).doesNotHaveDuplicates();
        assertThat(five.stream().filter(q->q.getCompany()!=null).count()).isEqualTo(1);
        assertThat(five.stream().collect(java.util.stream.Collectors.groupingBy(Question::getDifficulty,java.util.stream.Collectors.counting())))
                .containsEntry("Easy",1L).containsEntry("Medium",3L).containsEntry("Hard",1L);

        List<Question> ten=selector.select(user,role,List.of(type),company,"Medium",List.of(),10);
        assertThat(ten).hasSize(10).extracting(Question::getNormalizedText).doesNotHaveDuplicates();
        assertThat(ten.stream().filter(q->q.getCompany()!=null).count()).isEqualTo(2);
        assertThat(ten.stream().collect(java.util.stream.Collectors.groupingBy(Question::getDifficulty,java.util.stream.Collectors.counting())))
                .containsEntry("Easy",3L).containsEntry("Medium",4L).containsEntry("Hard",3L);

        User savedUser=user;
        questions.findByActiveTrue().stream()
                .filter(q->q.getTechRole().getId().equals(role.getId())&&q.getInterviewType().getId().equals(type.getId()))
                .forEach(q->{QuestionHistory item=new QuestionHistory();item.setUser(savedUser);item.setQuestion(q);item.setShownCount(1);history.save(item);});
        assertThat(selector.select(user,role,List.of(type),company,"Medium")).hasSize(15);

        String preferredTopic=questions.findByActiveTrue().stream()
                .filter(q->q.getTechRole().getId().equals(role.getId())&&q.getInterviewType().getId().equals(type.getId())&&q.getCompany()==null)
                .map(Question::getTopic).findFirst().orElseThrow();
        assertThat(selector.select(user,role,List.of(type),company,"Medium",List.of(preferredTopic)))
                .anyMatch(q->q.getTopic().equals(preferredTopic));

        InterviewType behavioral=types.findByName("Behavioral").orElseThrow();
        InterviewType systemDesign=types.findByName("System Design").orElseThrow();
        List<Question> mixed=selector.select(user,role,List.of(type,behavioral,systemDesign),company,"Medium");
        assertThat(mixed).hasSize(15).extracting(Question::getId).doesNotHaveDuplicates();
        assertThat(mixed).extracting(Question::getNormalizedText).doesNotHaveDuplicates();
        assertThat(mixed.stream().filter(q->q.getCompany()!=null).count()).isEqualTo(3);
        assertThat(mixed.stream().collect(java.util.stream.Collectors.groupingBy(Question::getCategory,java.util.stream.Collectors.counting())))
                .containsEntry("Technical",5L).containsEntry("Behavioral",5L).containsEntry("System Design",5L);
    }
}
