import ResponseModel from "../models/Response";
import SurveyModel from "../models/Survey";

// inside your submitFeedback controller:

export const submitFeedback = async (req: any, res: any) => {
  try {
    const { surveyId, answers: payloadAnswers } = req.body;

    const survey = await SurveyModel.findById(surveyId).lean();
    if (!survey) {
      return res.status(404).json({ error: "survey_not_found" });
    }

    // Map question id to question object for prompt lookup
    const questionMap = new Map<string, any>();
    for (const q of survey.questions) {
      questionMap.set(String(q._id), q);
    }

    const answersForDb = payloadAnswers.map((a: any) => {
      const q = questionMap.get(String(a.questionId));

      // Build base answer
      const base: any = {
        questionId: a.questionId,
        type: a.type,
      };

      if (a.type === "scale5") {
        base.valueNumber = a.valueNumber;
      } else if (a.type === "boolean") {
        base.valueBoolean = a.valueBoolean;
      } else if (a.type === "text") {
        base.valueText = a.valueText;
      }

      // Attach snapshot of question prompt if found
      if (q && q.prompt) {
        base.questionPrompt = {
          fi: q.prompt.fi ?? undefined,
          en: q.prompt.en ?? undefined,
          sv: q.prompt.sv ?? undefined,
        };
      }

      return base;
    });

    await ResponseModel.create({
      surveyId: survey._id,
      surveyVersion: survey.version ?? 1,
      answers: answersForDb,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal_error" });
  }
};
