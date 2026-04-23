import { GoogleGenAI, Type } from "@google/genai";

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const MODELS = {
  text: "gemini-3-flash-preview",
  reasoning: "gemini-3.1-pro-preview"
};

export interface AIReportResult {
  summary: string;
  actionItems: {
    task: string;
    assignee: string;
    dueDate: string;
    category: "견적" | "샘플" | "도면수정" | "사양협의" | "기타";
  }[];
}

export async function generateReportFromNotes(notes: string): Promise<AIReportResult> {
  const prompt = `
    제조업 영업직의 출장 보고서를 작성하는 AI입니다. 
    사용자가 제공한 음성 메모나 텍스트 노트를 분석하여 전문적이고 세련된 보고서 초안과 실행 과제(Action Items)를 추출하세요.
    
    분석할 노트:
    "${notes}"
    
    출력 형식은 JSON이며 다음 구조를 따릅니다:
    {
      "summary": "보고서 본문 (상담 내용, 특이 사항 포함)",
      "actionItems": [
        {
          "task": "업무 내용",
          "assignee": "담당 부서 또는 이름 (알 수 없으면 '미정')",
          "dueDate": "마감 기한 (YYYY-MM-DD 형식, 유추 불가시 공백)",
          "category": "견적|샘플|도면수정|사양협의|기타 중 선택"
        }
      ]
    }
    
    어조는 '영업킹갓'이라는 앱 이름에 걸맞게 열정적이고 자신감 넘치면서도 정보는 정확해야 합니다.
  `;

  const response = await ai.models.generateContent({
    model: MODELS.text,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          actionItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                task: { type: Type.STRING },
                assignee: { type: Type.STRING },
                dueDate: { type: Type.STRING },
                category: { 
                  type: Type.STRING,
                  enum: ["견적", "샘플", "도면수정", "사양협의", "기타"]
                }
              },
              required: ["task", "assignee", "category"]
            }
          }
        },
        required: ["summary", "actionItems"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as AIReportResult;
}

export async function extractReceiptInfo(receiptText: string): Promise<{ merchant: string, amount: number, date: string }> {
  // Placeholder for OCR logic simulated by Gemini if the user provides text or image-to-text is handled
  const prompt = `영수증 텍스트에서 상호명, 금액, 날짜를 추출하세요. JSON 형식. 텍스트: "${receiptText}"`;
  const response = await ai.models.generateContent({
    model: MODELS.text,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          merchant: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          date: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text || "{}");
}
