package com.roadmaptracker.RoadmapTracker.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Milestone {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    int id;
    Quarter quarter;
    String description;
    boolean done;

    public Milestone(){

    }

    public Milestone(Quarter quarter, String description, boolean done) {
        this.quarter = quarter;
        this.description = description;
        this.done = done;
    }

    public void setDone(boolean done) {
        this.done = done;
    }

    public boolean isDone(){
        return  this.done;
    }

    public int getId() {
        return id;
    }

    public Quarter getQuarter() {
        return quarter;
    }

    public void setQuarter(Quarter quarter) {
        this.quarter = quarter;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
