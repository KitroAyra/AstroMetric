
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AnalysisReport, ModelSettings } from "../types";

// Initialize client securely
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFlightTelemetry = async (dataSummary: string, settings: ModelSettings): Promise<AnalysisReport> => {
  const { modelName, thinkingBudget } = settings;
  
  const prompt = `
    You are a Senior Flight Data Analyst for a rocket launch. 
    Analyze the following flight telemetry summary and anomaly report. 
    
    Telemetry Data:
    ${dataSummary}

    Provide a JSON response with the following structure:
    {
        "status": "success" | "warning" | "critical",
        "summary": "A concise 2-3 sentence summary of the flight performance.",
        "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
        "recommendations": ["Recommendation 1", "Recommendation 2"]
    }
    
    IMPORTANT: All text fields (summary, keyInsights, recommendations) MUST be in Chinese.
    Focus on engineering assessment. If high severity anomalies are present, status should be warning or critical.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget }, 
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AnalysisReport;
  } catch (error) {
    console.error("Analysis failed", error);
    return {
        status: "unknown",
        summary: "由于 API 错误，分析失败。",
        keyInsights: ["无法处理数据。"],
        recommendations: ["检查 API 密钥和网络连接。", `错误信息: ${(error as any).message}`]
    };
  }
};

export const analyzeRangeTelemetry = async (rangeSummary: string, settings: ModelSettings): Promise<string> => {
    const { modelName, thinkingBudget } = settings;
    
    const prompt = `
      You are analyzing a specific segment of rocket flight telemetry.
      The user has isolated a time range and selected specific metrics for joint analysis.
      
      Data Segment:
      ${rangeSummary}
      
      Task:
      1. Analyze the behavior of the selected metrics during this specific interval.
      2. Identify any correlations or inverse relationships between them in this window.
      3. If there are anomalies (spikes/drops), explain potential physical causes (e.g., staging event, Max-Q, engine cutoff).
      
      Output:
      Provide a concise, technical paragraph in Chinese explaining the relationship between these metrics in this timeframe. 
      Do not output JSON. Output plain text/markdown.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget },
        }
      });
      return response.text || "分析无结果。";
    } catch (error) {
      console.error("Range analysis failed", error);
      return "区间分析失败。";
    }
  };

export const chatWithFlightData = async (
    history: {role: 'user' | 'model', text: string}[], 
    newMessage: string, 
    contextData: string,
    settings: ModelSettings,
    imagePart?: string // base64
) => {
    const { modelName, thinkingBudget } = settings;
    
    // Construct system context
    const systemInstruction = `You are AstroAI, a flight data assistant. 
    Context: User is analyzing a rocket flight.
    Data Summary: ${contextData}
    
    Answer brief, technical, and helpful questions.
    IMPORTANT: Please reply in Chinese.`;

    const chat = ai.chats.create({
        model: modelName,
        config: {
            systemInstruction
        }
    });
    
    const parts: any[] = [];
    
    if (imagePart) {
        parts.push({
            inlineData: {
                mimeType: "image/jpeg",
                data: imagePart
            }
        });
    }
    
    parts.push({ text: `History:\n${history.map(h => `${h.role}: ${h.text}`).join('\n')}\n\nUser: ${newMessage}` });

    const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config: {
            systemInstruction,
            thinkingConfig: { thinkingBudget }
        }
    });

    return response.text || "我无法生成回答。";
};
