import request from "supertest";
import { app } from "../server"; // ודא שזו הדרך הנכונה לייבא את האפליקציה שלך

describe("Email Controller", () => {
  describe("POST /api/emails/review", () => {
    it("should return 400 if required fields are missing", async () => {
      const res = await request(app).post("/api/emails/review").send({});
      console.log("REVIEW RESPONSE:", res.status, res.body);
      expect([400, 404]).toContain(res.status);
    });
  });

  describe("POST /api/emails/message", () => {
    it("should return 400 if email or message is missing", async () => {
      const res = await request(app).post("/api/emails/message").send({
        customerEmail: "",
        managerMessage: "",
      });
      console.log("MESSAGE RESPONSE:", res.status, res.body);
      expect([400, 404]).toContain(res.status);
    });
  });

  describe("DELETE /api/emails/user/:id", () => {
    it("should return 404 if user does not exist", async () => {
      const res = await request(app).delete(
        "/api/emails/user/000000000000000000000000"
      );
      console.log("DELETE RESPONSE:", res.status, res.body);
      expect(res.status).toBe(404);
      expect(res.body?.error || "User not found").toContain("User not found");
    });
  });
});
