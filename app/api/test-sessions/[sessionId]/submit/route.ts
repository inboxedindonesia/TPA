import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserFromRequest, getFallbackUserInfo } from "@/lib/auth";
import { logTestCompleted } from "@/lib/activityLogger";

// Endpoint: /api/test-sessions/[sessionId]/submit
export async function POST(request: Request, context: any) {
  try {
    const { sessionId } = await context.params;
    const { answers } = await request.json();

    if (!sessionId || !answers || typeof answers !== "object") {
      console.error("[ERROR] Data tidak lengkap", { sessionId, answers });
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Cek status sesi
      const sessionRes = await client.query(
        "SELECT * FROM test_sessions WHERE id = $1",
        [sessionId]
      );
      if (sessionRes.rows.length === 0) {
        console.error("[ERROR] Sesi tes tidak ditemukan", sessionId);
        return NextResponse.json(
          { error: "Sesi tes tidak ditemukan" },
          { status: 404 }
        );
      }
      const session = sessionRes.rows[0];
      if (session.status !== "ONGOING") {
        console.error(
          "[ERROR] Tes sudah diselesaikan atau dibatalkan",
          session.status
        );
        return NextResponse.json(
          { error: "Tes sudah diselesaikan atau dibatalkan" },
          { status: 400 }
        );
      }

      // Get test type
      const testTypeRes = await client.query(
        "SELECT test_type FROM tests WHERE id = $1",
        [session.testId]
      );
      const testType = testTypeRes.rows[0]?.test_type || "TPA";

      // Simpan jawaban peserta ke tabel answers
      for (const [questionId, answer] of Object.entries(answers)) {
        // Generate unique ID untuk answer
        const answerId = `ans_${sessionId}_${questionId}_${Date.now()}`;

        // Check if answer already exists
        const existingAnswer = await client.query(
          `SELECT id FROM answers WHERE "sessionId" = $1 AND "questionId" = $2`,
          [sessionId, questionId]
        );

        if (existingAnswer.rows.length > 0) {
          // Update existing answer
          await client.query(
            `UPDATE answers SET "selectedAnswer" = $1, "answeredAt" = NOW() AT TIME ZONE 'Asia/Jakarta'
             WHERE "sessionId" = $2 AND "questionId" = $3`,
            [answer, sessionId, questionId]
          );
        } else {
          // Insert new answer
          await client.query(
            `INSERT INTO answers (id, "sessionId", "questionId", "selectedAnswer", "isCorrect", "pointsEarned", "answeredAt")
             VALUES ($1, $2, $3, $4, $5, $6, NOW() AT TIME ZONE 'Asia/Jakarta')`,
            [answerId, sessionId, questionId, answer, false, 0]
          );
        }
      }

      const scoreTpaAptitude = async () => {
        const questionsRes = await client.query(
          `SELECT q.id, q."correctAnswer", q.points, q.category, q.options
           FROM questions q
           INNER JOIN test_questions tq ON q.id = tq.question_id
           WHERE tq.test_id = $1`,
          [session.testId]
        );
        const questions = questionsRes.rows;

        let score = 0,
          maxScore = 0;
        let scoreVerbal = 0,
          maxScoreVerbal = 0;
        let scoreAngka = 0,
          maxScoreAngka = 0;
        let scoreLogika = 0,
          maxScoreLogika = 0;
        let scoreGambar = 0,
          maxScoreGambar = 0;

        for (const q of questions) {
          const userAnswer = answers[q.id];
          const point = typeof q.points === "number" ? q.points : 1;
          const category = q.category || "";

          maxScore += point;
          if (category === "TES_VERBAL") maxScoreVerbal += point;
          else if (category === "TES_ANGKA") maxScoreAngka += point;
          else if (category === "TES_LOGIKA") maxScoreLogika += point;
          else if (category === "TES_GAMBAR") maxScoreGambar += point;

          let correct = false;
          let correctAnswer = q.correctAnswer;
          if (typeof correctAnswer === "string") {
            const trimmed = correctAnswer.trim();
            if (
              (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
              (trimmed.startsWith("{") && trimmed.endsWith("}"))
            ) {
              try {
                correctAnswer = JSON.parse(trimmed);
              } catch (e) {
                console.error("[ERROR] Gagal parse correctAnswer:", trimmed, e);
              }
            }
          }

          if (Array.isArray(correctAnswer)) {
            correct = Array.isArray(userAnswer)
              ? JSON.stringify(userAnswer.sort()) ===
                JSON.stringify(correctAnswer.sort())
              : correctAnswer.includes(userAnswer);
          } else {
            correct = userAnswer == correctAnswer;
          }

          const pointsEarned = correct ? point : 0;
          await client.query(
            `UPDATE answers SET "isCorrect" = $1, "pointsEarned" = $2 
             WHERE "sessionId" = $3 AND "questionId" = $4`,
            [correct, pointsEarned, sessionId, q.id]
          );

          if (correct) {
            score += point;
            if (category === "TES_VERBAL") scoreVerbal += point;
            else if (category === "TES_ANGKA") scoreAngka += point;
            else if (category === "TES_LOGIKA") scoreLogika += point;
            else if (category === "TES_GAMBAR") scoreGambar += point;
          }
        }

        await client.query(
          `UPDATE test_sessions SET 
           status = 'COMPLETED', "endTime" = (NOW() AT TIME ZONE 'Asia/Jakarta'), 
           score = $1, "maxScore" = $2,
           score_verbal = $3, max_score_verbal = $4,
           score_angka = $5, max_score_angka = $6,
           score_logika = $7, max_score_logika = $8,
           score_gambar = $9, max_score_gambar = $10
           WHERE id = $11`,
          [
            score,
            maxScore,
            scoreVerbal,
            maxScoreVerbal,
            scoreAngka,
            maxScoreAngka,
            scoreLogika,
            maxScoreLogika,
            scoreGambar,
            maxScoreGambar,
            sessionId,
          ]
        );
      };

      const scoreRiasec = async () => {
        const questionsRes = await client.query(
          `SELECT q.id, q.points, q.category, q.options
           FROM questions q
           INNER JOIN test_questions tq ON q.id = tq.question_id
           WHERE tq.test_id = $1`,
          [session.testId]
        );
        const questions = questionsRes.rows;

        // Raw & max per dimensi (Likert 1-5)
        let scoreRealistic = 0,
          maxScoreRealistic = 0,
          highRealistic = 0;
        let scoreInvestigative = 0,
          maxScoreInvestigative = 0,
          highInvestigative = 0;
        let scoreArtistic = 0,
          maxScoreArtistic = 0,
          highArtistic = 0;
        let scoreSocial = 0,
          maxScoreSocial = 0,
          highSocial = 0;
        let scoreEnterprising = 0,
          maxScoreEnterprising = 0,
          highEnterprising = 0;
        let scoreConventional = 0,
          maxScoreConventional = 0,
          highConventional = 0;

        const HIGH_THRESHOLD = 4; // jawaban >=4 dianggap tinggi

        for (const q of questions) {
          const category = q.category || "";
          const userAnswer = answers[q.id]; // bisa index (0..4), 1-5, string likert, atau object

          const isRiasec = [
            "TES_REALISTIC",
            "TES_INVESTIGATIVE",
            "TES_ARTISTIC",
            "TES_SOCIAL",
            "TES_ENTERPRISING",
            "TES_CONVENTIONAL",
          ].includes(category);
          if (!isRiasec) continue;

          // Normalisasi max per item = 5
          const itemMax = 5;
          if (category === "TES_REALISTIC") maxScoreRealistic += itemMax;
          else if (category === "TES_INVESTIGATIVE")
            maxScoreInvestigative += itemMax;
          else if (category === "TES_ARTISTIC") maxScoreArtistic += itemMax;
          else if (category === "TES_SOCIAL") maxScoreSocial += itemMax;
          else if (category === "TES_ENTERPRISING")
            maxScoreEnterprising += itemMax;
          else if (category === "TES_CONVENTIONAL")
            maxScoreConventional += itemMax;

          if (userAnswer === undefined || userAnswer === null) continue;

          // Normalisasi jawaban ke skala 1..5
          let itemScore: number | null = null;
          const parseLikert = (raw: any): number | null => {
            if (raw === null || raw === undefined) return null;
            if (typeof raw === "number") {
              if (raw >= 1 && raw <= 5) return raw; // sudah 1..5
              if (raw >= 0 && raw <= 4) return raw + 1; // index 0..4
            }
            if (typeof raw === "string") {
              const trimmed = raw.trim();
              const lower = trimmed.toLowerCase();
              if (lower.startsWith("sangat tidak setuju")) return 1;
              if (lower.startsWith("tidak setuju")) return 2;
              if (lower.includes("netral")) return 3;
              if (lower.startsWith("sangat setuju")) return 5;
              if (lower.startsWith("setuju")) return 4;
              // numeric string
              if (/^[1-5]$/.test(trimmed)) return parseInt(trimmed, 10);
              // coba cocokkan exact option
              try {
                if (q.options) {
                  let opts = q.options as any;
                  if (typeof opts === "string") {
                    const ot = opts.trim();
                    if (ot.startsWith("[") && ot.endsWith("]"))
                      opts = JSON.parse(ot);
                  }
                  if (Array.isArray(opts)) {
                    const idxExact = opts.findIndex(
                      (o: any) =>
                        String(o).toLowerCase() === trimmed.toLowerCase()
                    );
                    if (idxExact >= 0) return idxExact + 1;
                    // fuzzy: cocokkan huruf pertama (Sangat Tidak Setuju = S, dst) & panjang > 0
                    const first = trimmed[0].toLowerCase();
                    const idxFirst = opts.findIndex((o: any) =>
                      String(o).toLowerCase().startsWith(first)
                    );
                    if (idxFirst >= 0) return idxFirst + 1;
                  }
                }
              } catch {}
            }
            if (typeof raw === "object") {
              // pattern { value:3 } atau { index:2 }
              if ("value" in raw && typeof (raw as any).value === "number") {
                return parseLikert((raw as any).value);
              }
              if ("index" in raw && typeof (raw as any).index === "number") {
                return parseLikert((raw as any).index);
              }
            }
            return null;
          };
          itemScore = parseLikert(userAnswer);
          if (itemScore === null) continue; // skip jika benar-benar tidak bisa diinterpretasi

          const isHigh = itemScore >= HIGH_THRESHOLD;

          // Simpan ke answers (pointsEarned = itemScore, isCorrect=true)
          await client.query(
            `UPDATE answers SET "isCorrect" = $1, "pointsEarned" = $2 WHERE "sessionId" = $3 AND "questionId" = $4`,
            [true, itemScore, sessionId, q.id]
          );

          if (category === "TES_REALISTIC") {
            scoreRealistic += itemScore;
            if (isHigh) highRealistic++;
          } else if (category === "TES_INVESTIGATIVE") {
            scoreInvestigative += itemScore;
            if (isHigh) highInvestigative++;
          } else if (category === "TES_ARTISTIC") {
            scoreArtistic += itemScore;
            if (isHigh) highArtistic++;
          } else if (category === "TES_SOCIAL") {
            scoreSocial += itemScore;
            if (isHigh) highSocial++;
          } else if (category === "TES_ENTERPRISING") {
            scoreEnterprising += itemScore;
            if (isHigh) highEnterprising++;
          } else if (category === "TES_CONVENTIONAL") {
            scoreConventional += itemScore;
            if (isHigh) highConventional++;
          }
        }

        // Holland code dengan tie-break high answer count
        const riasecScores = [
          { code: "R", score: scoreRealistic, high: highRealistic },
          { code: "I", score: scoreInvestigative, high: highInvestigative },
          { code: "A", score: scoreArtistic, high: highArtistic },
          { code: "S", score: scoreSocial, high: highSocial },
          { code: "E", score: scoreEnterprising, high: highEnterprising },
          { code: "C", score: scoreConventional, high: highConventional },
        ];
        riasecScores.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (b.high !== a.high) return b.high - a.high;
          // fallback urutan R I A S E C
          const order = ["R", "I", "A", "S", "E", "C"];
          return order.indexOf(a.code) - order.indexOf(b.code);
        });
        const hollandCode = riasecScores
          .slice(0, 3)
          .map((i) => i.code)
          .join("");

        const totalScore =
          scoreRealistic +
          scoreInvestigative +
          scoreArtistic +
          scoreSocial +
          scoreEnterprising +
          scoreConventional;
        const maxTotalScore =
          maxScoreRealistic +
          maxScoreInvestigative +
          maxScoreArtistic +
          maxScoreSocial +
          maxScoreEnterprising +
          maxScoreConventional;

        await client.query(
          `UPDATE test_sessions SET
           status = 'COMPLETED', "endTime" = (NOW() AT TIME ZONE 'Asia/Jakarta'),
           score = $1, "maxScore" = $2,
           score_realistic = $3, max_score_realistic = $4,
           score_investigative = $5, max_score_investigative = $6,
           score_artistic = $7, max_score_artistic = $8,
           score_social = $9, max_score_social = $10,
           score_enterprising = $11, max_score_enterprising = $12,
           score_conventional = $13, max_score_conventional = $14,
           holland_code = $15
           WHERE id = $16`,
          [
            totalScore,
            maxTotalScore,
            scoreRealistic,
            maxScoreRealistic,
            scoreInvestigative,
            maxScoreInvestigative,
            scoreArtistic,
            maxScoreArtistic,
            scoreSocial,
            maxScoreSocial,
            scoreEnterprising,
            maxScoreEnterprising,
            scoreConventional,
            maxScoreConventional,
            hollandCode,
            sessionId,
          ]
        );
      };

      if (testType === "RIASEC") {
        await scoreRiasec();
      } else if (testType === "COMBO") {
        // Combined scoring: aptitude + RIASEC dalam satu kali update agar nilai aptitude tidak dioverwrite.
        const questionsRes = await client.query(
          `SELECT q.id, q."correctAnswer", q.points, q.category
           FROM questions q
           INNER JOIN test_questions tq ON q.id = tq.question_id
           WHERE tq.test_id = $1`,
          [session.testId]
        );
        const questions = questionsRes.rows;

        // Aptitude (TPA) score vars
        let scoreVerbal = 0,
          maxScoreVerbal = 0;
        let scoreAngka = 0,
          maxScoreAngka = 0;
        let scoreLogika = 0,
          maxScoreLogika = 0;
        let scoreGambar = 0,
          maxScoreGambar = 0;

        // RIASEC score vars
        let scoreRealistic = 0,
          maxScoreRealistic = 0,
          highRealistic = 0;
        let scoreInvestigative = 0,
          maxScoreInvestigative = 0,
          highInvestigative = 0;
        let scoreArtistic = 0,
          maxScoreArtistic = 0,
          highArtistic = 0;
        let scoreSocial = 0,
          maxScoreSocial = 0,
          highSocial = 0;
        let scoreEnterprising = 0,
          maxScoreEnterprising = 0,
          highEnterprising = 0;
        let scoreConventional = 0,
          maxScoreConventional = 0,
          highConventional = 0;

        const HIGH_THRESHOLD = 4;

        for (const q of questions) {
          const point = typeof q.points === "number" ? q.points : 1;
          const category = q.category || "";
          const userAnswer = answers[q.id];

          const isRiasecCategory = [
            "TES_REALISTIC",
            "TES_INVESTIGATIVE",
            "TES_ARTISTIC",
            "TES_SOCIAL",
            "TES_ENTERPRISING",
            "TES_CONVENTIONAL",
          ].includes(category);

          if (isRiasecCategory) {
            // Likert normalization: max per item = 5
            const itemMax = 5;
            if (category === "TES_REALISTIC") maxScoreRealistic += itemMax;
            else if (category === "TES_INVESTIGATIVE")
              maxScoreInvestigative += itemMax;
            else if (category === "TES_ARTISTIC") maxScoreArtistic += itemMax;
            else if (category === "TES_SOCIAL") maxScoreSocial += itemMax;
            else if (category === "TES_ENTERPRISING")
              maxScoreEnterprising += itemMax;
            else if (category === "TES_CONVENTIONAL")
              maxScoreConventional += itemMax;

            if (userAnswer !== undefined && userAnswer !== null) {
              // Map answer to index 0..4 if needed
              // Normalisasi jawaban ke skala 1..5 (COMBO)
              let itemScore: number | null = null;
              const parseLikert = (raw: any): number | null => {
                if (raw === null || raw === undefined) return null;
                if (typeof raw === "number") {
                  if (raw >= 1 && raw <= 5) return raw;
                  if (raw >= 0 && raw <= 4) return raw + 1;
                }
                if (typeof raw === "string") {
                  const trimmed = raw.trim();
                  const lower = trimmed.toLowerCase();
                  if (lower.startsWith("sangat tidak setuju")) return 1;
                  if (lower.startsWith("tidak setuju")) return 2;
                  if (lower.includes("netral")) return 3;
                  if (lower.startsWith("sangat setuju")) return 5;
                  if (lower.startsWith("setuju")) return 4;
                  if (/^[1-5]$/.test(trimmed)) return parseInt(trimmed, 10);
                  try {
                    if (q.options) {
                      let opts = q.options as any;
                      if (typeof opts === "string") {
                        const ot = opts.trim();
                        if (ot.startsWith("[") && ot.endsWith("]"))
                          opts = JSON.parse(ot);
                      }
                      if (Array.isArray(opts)) {
                        const idxExact = opts.findIndex(
                          (o: any) =>
                            String(o).toLowerCase() === trimmed.toLowerCase()
                        );
                        if (idxExact >= 0) return idxExact + 1;
                        const first = trimmed[0].toLowerCase();
                        const idxFirst = opts.findIndex((o: any) =>
                          String(o).toLowerCase().startsWith(first)
                        );
                        if (idxFirst >= 0) return idxFirst + 1;
                      }
                    }
                  } catch {}
                }
                if (typeof raw === "object") {
                  if ("value" in raw && typeof (raw as any).value === "number")
                    return parseLikert((raw as any).value);
                  if ("index" in raw && typeof (raw as any).index === "number")
                    return parseLikert((raw as any).index);
                }
                return null;
              };
              itemScore = parseLikert(userAnswer);
              if (itemScore === null) continue;
              const isHighCombo = itemScore >= HIGH_THRESHOLD;
              const isHigh = itemScore >= HIGH_THRESHOLD;

              await client.query(
                `UPDATE answers SET "isCorrect" = $1, "pointsEarned" = $2 WHERE "sessionId" = $3 AND "questionId" = $4`,
                [true, itemScore, sessionId, q.id]
              );

              if (category === "TES_REALISTIC") {
                scoreRealistic += itemScore;
                if (isHighCombo) highRealistic++;
              } else if (category === "TES_INVESTIGATIVE") {
                scoreInvestigative += itemScore;
                if (isHighCombo) highInvestigative++;
              } else if (category === "TES_ARTISTIC") {
                scoreArtistic += itemScore;
                if (isHighCombo) highArtistic++;
              } else if (category === "TES_SOCIAL") {
                scoreSocial += itemScore;
                if (isHighCombo) highSocial++;
              } else if (category === "TES_ENTERPRISING") {
                scoreEnterprising += itemScore;
                if (isHighCombo) highEnterprising++;
              } else if (category === "TES_CONVENTIONAL") {
                scoreConventional += itemScore;
                if (isHighCombo) highConventional++;
              }
            }
          } else {
            // Aptitude categories: treat with correctness rules
            if (category === "TES_VERBAL") maxScoreVerbal += point;
            else if (category === "TES_ANGKA") maxScoreAngka += point;
            else if (category === "TES_LOGIKA") maxScoreLogika += point;
            else if (category === "TES_GAMBAR") maxScoreGambar += point;

            // Evaluate correctness
            let correct = false;
            let correctAnswer = q.correctAnswer;
            if (typeof correctAnswer === "string") {
              const trimmed = correctAnswer.trim();
              if (
                (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
                (trimmed.startsWith("{") && trimmed.endsWith("}"))
              ) {
                try {
                  correctAnswer = JSON.parse(trimmed);
                } catch (e) {
                  console.error(
                    "[ERROR] Gagal parse correctAnswer (COMBO):",
                    trimmed,
                    e
                  );
                }
              }
            }
            if (Array.isArray(correctAnswer)) {
              correct = Array.isArray(userAnswer)
                ? JSON.stringify(userAnswer.sort()) ===
                  JSON.stringify(correctAnswer.sort())
                : correctAnswer.includes(userAnswer);
            } else {
              correct = userAnswer == correctAnswer;
            }
            const pointsEarned = correct ? point : 0;
            await client.query(
              `UPDATE answers SET "isCorrect" = $1, "pointsEarned" = $2 WHERE "sessionId" = $3 AND "questionId" = $4`,
              [correct, pointsEarned, sessionId, q.id]
            );
            if (correct) {
              if (category === "TES_VERBAL") scoreVerbal += point;
              else if (category === "TES_ANGKA") scoreAngka += point;
              else if (category === "TES_LOGIKA") scoreLogika += point;
              else if (category === "TES_GAMBAR") scoreGambar += point;
            }
          }
        }

        // Hitung holland code dari skor RIASEC dengan tie-break high answers
        const riasecScores = [
          { code: "R", score: scoreRealistic, high: highRealistic },
          { code: "I", score: scoreInvestigative, high: highInvestigative },
          { code: "A", score: scoreArtistic, high: highArtistic },
          { code: "S", score: scoreSocial, high: highSocial },
          { code: "E", score: scoreEnterprising, high: highEnterprising },
          { code: "C", score: scoreConventional, high: highConventional },
        ];
        riasecScores.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (b.high !== a.high) return b.high - a.high;
          const order = ["R", "I", "A", "S", "E", "C"];
          return order.indexOf(a.code) - order.indexOf(b.code);
        });
        const hollandCode = riasecScores
          .slice(0, 3)
          .map((item) => item.code)
          .join("");

        const aptitudeScoreTotal =
          scoreVerbal + scoreAngka + scoreLogika + scoreGambar;
        const aptitudeMaxScoreTotal =
          maxScoreVerbal + maxScoreAngka + maxScoreLogika + maxScoreGambar;

        await client.query(
          `UPDATE test_sessions SET 
           status = 'COMPLETED', "endTime" = (NOW() AT TIME ZONE 'Asia/Jakarta'),
           score = $1, "maxScore" = $2,
           score_verbal = $3, max_score_verbal = $4,
           score_angka = $5, max_score_angka = $6,
           score_logika = $7, max_score_logika = $8,
           score_gambar = $9, max_score_gambar = $10,
           score_realistic = $11, max_score_realistic = $12,
           score_investigative = $13, max_score_investigative = $14,
           score_artistic = $15, max_score_artistic = $16,
           score_social = $17, max_score_social = $18,
           score_enterprising = $19, max_score_enterprising = $20,
           score_conventional = $21, max_score_conventional = $22,
           holland_code = $23
           WHERE id = $24`,
          [
            aptitudeScoreTotal,
            aptitudeMaxScoreTotal,
            scoreVerbal,
            maxScoreVerbal,
            scoreAngka,
            maxScoreAngka,
            scoreLogika,
            maxScoreLogika,
            scoreGambar,
            maxScoreGambar,
            scoreRealistic,
            maxScoreRealistic,
            scoreInvestigative,
            maxScoreInvestigative,
            scoreArtistic,
            maxScoreArtistic,
            scoreSocial,
            maxScoreSocial,
            scoreEnterprising,
            maxScoreEnterprising,
            scoreConventional,
            maxScoreConventional,
            hollandCode,
            sessionId,
          ]
        );
      } else {
        await scoreTpaAptitude();
      }

      // Get user info and test name for notification
      const userInfo =
        (await getUserFromRequest(request)) || getFallbackUserInfo();

      // Get test name
      const testRes = await client.query(
        `SELECT name FROM tests WHERE id = $1`,
        [session.testId]
      );
      const testName = testRes.rows[0]?.name || "Unknown Test";

      const finalScoreRes = await client.query(
        "SELECT score FROM test_sessions WHERE id = $1",
        [sessionId]
      );
      const finalScore = finalScoreRes.rows[0]?.score || 0;

      // Log test completed activity
      try {
        await logTestCompleted(
          userInfo.userId,
          userInfo.userName,
          userInfo.userRole || "peserta",
          session.testId,
          testName,
          finalScore
        );
      } catch (error) {
        console.error("Error logging test completion activity:", error);
      }

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[ERROR SUBMIT TES]", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan server",
        detail:
          error && typeof error === "object" && "message" in error
            ? (error as any).message
            : String(error),
      },
      { status: 500 }
    );
  }
}
