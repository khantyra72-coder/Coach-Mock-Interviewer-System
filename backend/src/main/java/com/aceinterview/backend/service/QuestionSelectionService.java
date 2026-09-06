package com.aceinterview.backend.service;

import com.aceinterview.backend.entity.*;
import com.aceinterview.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class QuestionSelectionService {
    private static final int TOPIC_CAP=2;
    private static final double SEMANTIC_LIMIT=.85;
    private final QuestionRepository questions;
    public QuestionSelectionService(QuestionRepository questions){this.questions=questions;}

    public List<Question> select(User user,TechRole role,List<InterviewType> types,Company company,String preferredDifficulty){return select(user,role,types,company,preferredDifficulty,List.of(),15);}
    public List<Question> select(User user,TechRole role,List<InterviewType> types,Company company,String preferredDifficulty,List<String> preferredTopics){return select(user,role,types,company,preferredDifficulty,preferredTopics,15);}
    public List<Question> select(User user,TechRole role,List<InterviewType> types,Company company,String preferredDifficulty,List<String> preferredTopics,int total){
        if(!Set.of(5,10,15).contains(total))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Question count must be 5, 10, or 15");
        List<Question> exact=questions.findByActiveTrue().stream().filter(q->"Approved".equals(q.getReviewStatus())).filter(q->q.getTechRole().getId().equals(role.getId())&&types.stream().anyMatch(type->q.getInterviewType().getId().equals(type.getId()))).toList();
        int companyTotal=company==null?0:switch(total){case 5->1;case 10->2;default->3;};
        Map<Long,Integer> totalByType=quotas(types,total);
        Map<Long,Integer> companyByType=company==null?types.stream().collect(Collectors.toMap(InterviewType::getId,type->0)):quotas(types,companyTotal);
        String preferred=preferredDifficulty!=null&&Set.of("Easy","Medium","Hard").contains(preferredDifficulty)?preferredDifficulty:"Medium";
        Map<String,Integer> target=difficultyTargets(total,preferred);
        for(InterviewType type:types){
            int companyNeeded=companyByType.get(type.getId()), sharedNeeded=totalByType.get(type.getId())-companyNeeded;
            long sharedAvailable=exact.stream().filter(q->q.getInterviewType().getId().equals(type.getId())&&q.getCompany()==null).count();
            long companyAvailable=exact.stream().filter(q->q.getInterviewType().getId().equals(type.getId())&&company!=null&&q.getCompany()!=null&&q.getCompany().getId().equals(company.getId())).count();
            if(sharedAvailable<sharedNeeded||companyAvailable<companyNeeded) fail(type,sharedAvailable,companyAvailable,sharedNeeded,companyNeeded);
        }
        Random random=new Random();
        for(int attempt=0;attempt<3000;attempt++){
            List<Question> chosen=new ArrayList<>(); Map<String,Integer> topics=new HashMap<>(),difficulty=new HashMap<>(); Set<String> normalized=new HashSet<>();
            boolean complete=true;
            for(InterviewType type:types){
                List<Question> shared=exact.stream().filter(q->q.getInterviewType().getId().equals(type.getId())&&q.getCompany()==null).toList();
                List<Question> specific=exact.stream().filter(q->q.getInterviewType().getId().equals(type.getId())&&company!=null&&q.getCompany()!=null&&q.getCompany().getId().equals(company.getId())).toList();
                int companyNeeded=companyByType.get(type.getId()), sharedNeeded=totalByType.get(type.getId())-companyNeeded;
                if(!addFrom(prioritized(specific,random,preferredTopics),companyNeeded,chosen,topics,difficulty,normalized,target)||!addFrom(prioritized(shared,random,preferredTopics),sharedNeeded,chosen,topics,difficulty,normalized,target)){complete=false;break;}
            }
            if(complete&&chosen.size()==total&&normalized.size()==total&&target.entrySet().stream().allMatch(e->difficulty.getOrDefault(e.getKey(),0).equals(e.getValue()))){Collections.shuffle(chosen);return chosen;}
        }
        throw new ResponseStatusException(HttpStatus.CONFLICT,"Unable to build a diverse "+total+"-question set without duplicates after type, topic, semantic-similarity and difficulty filters.");
    }
    private boolean addFrom(List<Question> pool,int needed,List<Question> chosen,Map<String,Integer> topics,Map<String,Integer> difficulty,Set<String> normalized,Map<String,Integer> target){
        int before=chosen.size();
        for(Question q:pool){if(chosen.size()-before==needed)break;String norm=normalize(q.getQuestionText());if(normalized.contains(norm)||topics.getOrDefault(q.getTopic(),0)>=TOPIC_CAP||difficulty.getOrDefault(q.getDifficulty(),0)>=target.getOrDefault(q.getDifficulty(),0)||chosen.stream().anyMatch(x->similarity(x.getQuestionText(),q.getQuestionText())>=SEMANTIC_LIMIT))continue;chosen.add(q);normalized.add(norm);topics.merge(q.getTopic(),1,Integer::sum);difficulty.merge(q.getDifficulty(),1,Integer::sum);}return chosen.size()-before==needed;
    }
    private List<Question> shuffled(List<Question> source,Random random){List<Question> copy=new ArrayList<>(source);Collections.shuffle(copy,random);return copy;}
    private List<Question> prioritized(List<Question> source,Random random,List<String> preferredTopics){
        List<Question> copy=shuffled(source,random);Set<String> preferred=preferredTopics==null?Set.of():preferredTopics.stream().filter(Objects::nonNull).map(this::normalize).filter(value->!value.isBlank()).collect(Collectors.toSet());
        copy.sort(Comparator.comparing((Question question)->matchesPreference(question.getTopic(),preferred)).reversed());return copy;
    }
    private boolean matchesPreference(String topic,Set<String> preferred){String value=normalize(topic);Set<String> topicTokens=preferenceTokens(value);return preferred.stream().anyMatch(item->item.equals(value)||item.contains(value)||value.contains(item)||preferenceTokens(item).stream().anyMatch(topicTokens::contains));}
    private Set<String> preferenceTokens(String value){return Arrays.stream(normalize(value).split(" ")).filter(word->word.length()>2).map(word->word.endsWith("s")&&word.length()>3?word.substring(0,word.length()-1):word).collect(Collectors.toSet());}
    private Map<Long,Integer> quotas(List<InterviewType> types,int total){Map<Long,Integer> result=new LinkedHashMap<>();for(int i=0;i<types.size();i++)result.put(types.get(i).getId(),total/types.size()+(i<total%types.size()?1:0));return result;}
    private Map<String,Integer> difficultyTargets(int total,String preferred){int other=total==5?1:total==10?3:4;Map<String,Integer>result=new HashMap<>(Map.of("Easy",other,"Medium",other,"Hard",other));result.put(preferred,total-other*2);return result;}
    private void fail(InterviewType type,long shared,long company,int neededShared,int neededCompany){throw new ResponseStatusException(HttpStatus.CONFLICT,"Not enough approved "+type.getName()+" questions. requiredShared="+neededShared+", availableShared="+shared+", requiredCompanySpecific="+neededCompany+", availableCompanySpecific="+company);}
    private String normalize(String s){return s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+"," ").trim();}
    private double similarity(String a,String b){Set<String>x=tokens(a),y=tokens(b);Set<String>i=new HashSet<>(x);i.retainAll(y);Set<String>u=new HashSet<>(x);u.addAll(y);return u.isEmpty()?0:(double)i.size()/u.size();}
    private Set<String> tokens(String s){return Arrays.stream(normalize(s).split(" ")).filter(w->w.length()>3).collect(Collectors.toSet());}
}
