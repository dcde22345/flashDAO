"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export default function EventTrigger() {
  const triggerEarthquakeEvent = async () => {
    const exampleEarthquakeEvent = {
      type: "Earthquake",
      name: "Hualien Earthquake",
      description:
        "A magnitude 7.2 earthquake hit Hualien County, causing significant damage to infrastructure and displacing thousands of residents.",
      severity: 8,
      location: "Hualien County, Taiwan",
      date: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/trigger-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exampleEarthquakeEvent),
      });

      if (response.ok) {
        alert("Earthquake event triggered successfully!");
      } else {
        alert(
          "Failed to trigger event. Please check the console for more information."
        );
        console.error("Event trigger failed:", await response.text());
      }
    } catch (error) {
      alert("Connection error. Please ensure the server is running.");
      console.error("Connection error:", error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Event Trigger</h1>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Simulate Disaster Event</h2>
        <Button
          onClick={triggerEarthquakeEvent}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
        >
          Trigger Earthquake
        </Button>
        <p className="mt-4 text-gray-600">
          Clicking this button will simulate a magnitude 7.2 earthquake in
          Hualien County and send the event data to the backend system.
        </p>
      </div>
    </div>
  );
}
