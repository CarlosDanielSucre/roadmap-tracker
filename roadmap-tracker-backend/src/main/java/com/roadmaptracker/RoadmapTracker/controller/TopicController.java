package com.roadmaptracker.RoadmapTracker.controller;

import com.roadmaptracker.RoadmapTracker.model.Topic;
import com.roadmaptracker.RoadmapTracker.repository.TopicRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = {
    "https://carlosdanielsucre.github.io",
    "http://127.0.0.1:5500"
})
public class TopicController {
    private final TopicRepository repository;

    public TopicController(TopicRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/topics")
    public List<Topic> getAllTopics() {
        return repository.findAll();
    }
    @GetMapping("/topics/{id}")
    public Optional<Topic> getTopicsById(@PathVariable int id) {
        return repository.findById(id);
    }
    @PostMapping("/topics")
    public Topic postTopic(@RequestBody Topic topic) {
        return repository.save(topic);
    }
    @DeleteMapping("/topics/{id}")
    public void deleteTopicById(@PathVariable int id) {
        repository.deleteById(id);
    }



}
