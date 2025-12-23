const request = require("supertest");
const app = require("../src/app");

describe("POST /chat", () => {
  it("returns message and disclaimer", async () => {
    const response = await request(app).post("/chat").send({
      metrics: {
        average_steps: 8500,
        average_sleep_hours: 6.5,
        average_resting_hr: 70,
        hrv_rmssd: 55,
        stress_index: 60,
        calories_burned: 2200,
        sleep_efficiency: 0.85,
      },
      user_context: {
        age: 34,
        gender: "male",
        fitness_goal: "Train for a half marathon",
        sleep_goal: "Improve sleep duration",
      },
      query: "I feel tired after work and my stress is high. How can I improve?",
      series: [
        {
          date: "2024-01-01",
          steps: 8000,
          sleep_hours: 6.2,
          resting_hr: 70,
          hrv_rmssd: 55,
          stress_index: 60,
          calories_burned: 2100,
          sleep_efficiency: 0.82,
          active_minutes: 40,
        },
      ],
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBeTruthy();
    expect(response.body.message.toLowerCase()).not.toContain("disclaimer");
  });
});
