package com.roadmaptracker.RoadmapTracker.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class StudyEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    int id;
    String date;
    String category;
    double hours;
    String note;

    public StudyEntry() {}

    public StudyEntry(String date, String category, double hours, String note) {
        this.date = date;
        this.category = category;
        this.hours = hours;
        this.note = note;
    }

    public int getId() {
        return id;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public double getHours() {
        return hours;
    }

    public void setHours(double hours) {
        this.hours = hours;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
