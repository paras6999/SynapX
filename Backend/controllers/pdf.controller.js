import fs from "fs/promises";
import { PDFParse } from "pdf-parse";

const readPdfText = async (filePath) => {
  const parser = new PDFParse({ url: filePath });
  try {
    const result = await parser.getText();
    return result.text.replace(/\r/g, "\n");
  } finally {
    await parser.destroy();
  }
};

const extractValue = (text, patterns, defaultValue = "") => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return defaultValue;
};

const normalizeYesNo = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (["yes", "positive", "true", "1"].includes(normalized)) return "1";
  if (["no", "negative", "false", "0"].includes(normalized)) return "0";
  return value || "";
};

const parseHeartReport = (text) => {
  const lineGap = String.raw`[\s:,-]*`;

  return {
    Age: extractValue(text, [/Age:\s*(\d+)/i]),
    Sex: extractValue(text, [/Sex:\s*(male|female|0|1)/i]),
    "Chest pain type": extractValue(text, [
      new RegExp(`Chest\\s+pain\\s+type${lineGap}(\\d+)`, "i"),
    ]),
    "Resting blood pressure": extractValue(text, [
      new RegExp(`Resting\\s+blood\\s+pressure${lineGap}(\\d+)`, "i"),
    ]),
    "Serum cholesterol in mg/dl": extractValue(text, [
      new RegExp(`Serum\\s+cholesterol(?:\\s+in\\s+mg/dl)?${lineGap}(\\d+)`, "i"),
    ]),
    "Fasting blood sugar > 120 mg/dl": normalizeYesNo(
      extractValue(text, [
        new RegExp(
          `Fasting\\s+blood\\s+sugar(?:\\s*>\\s*120\\s*mg/dl)?${lineGap}(yes|no|positive|negative|0|1)`,
          "i"
        ),
      ])
    ),
    "Resting Electrocardiographic Results": extractValue(text, [
      new RegExp(
        `Resting\\s+Electrocardiographic\\s+Results${lineGap}(\\d+)`,
        "i"
      ),
      new RegExp(`Resting\\s+ECG${lineGap}(\\d+)`, "i"),
    ]),
    "Maximum Heart Rate Achieved": extractValue(text, [
      new RegExp(`Maximum\\s+Heart\\s+Rate\\s+Achieved${lineGap}(\\d+)`, "i"),
      new RegExp(`Max(?:imum)?\\s+Heart\\s+Rate${lineGap}(\\d+)`, "i"),
    ]),
    "Exercise Induced Angina": extractValue(text, [
      new RegExp(`Exercise\\s+Induced\\s+Angina${lineGap}(yes|no|0|1)`, "i"),
    ]),
    "Old peak": extractValue(text, [
      new RegExp(`Old\\s*peak${lineGap}([0-9]+(?:\\.[0-9]+)?)`, "i"),
    ]),
    "Slope of the peak exercise ST Segment": extractValue(text, [
      new RegExp(`Slope\\s+of\\s+the\\s+peak\\s+exercise\\s+ST\\s+Segment${lineGap}(\\d+)`, "i"),
      new RegExp(`Slope${lineGap}(\\d+)`, "i"),
    ]),
    "Number of major vessels (0-3) colored by fluoroscopy": extractValue(text, [
      /Number\s+of\s+major\s+vessels\s*\(0\s*-?\s*3\)\s*colored\s+by\s+fluoroscopy:\s*(\d+)/i,
      /Major\s+Vessels\s*\(0\s*-?\s*3\):\s*(\d+)/i,
    ]),
    "Thal (Thallium Stress Test Result)": extractValue(text, [
      new RegExp(`Thal(?:\\s*\\(Thallium\\s+Stress\\s+Test\\s+Result\\))?${lineGap}(\\d+)`, "i"),
    ]),
  };
};

const parseDiabetesReport = (text) => ({
  Pregnancies: extractValue(text, [/Pregnancies:\s*(\d+)/i]),
  Glucose: extractValue(text, [/Glucose:\s*(\d+)/i]),
  BloodPressure: extractValue(text, [/Blood\s*Pressure:\s*(\d+)/i]),
  SkinThickness: extractValue(text, [/Skin\s*Thickness:\s*(\d+)/i]),
  Insulin: extractValue(text, [/Insulin:\s*(\d+)/i]),
  BMI: extractValue(text, [/BMI:\s*([0-9]+(?:\.[0-9]+)?)/i]),
  DiabetesPedigreeFunction: extractValue(text, [
    /Diabetes\s*Pedigree\s*Function:\s*([0-9]+(?:\.[0-9]+)?)/i,
  ]),
  Age: extractValue(text, [/Age:\s*(\d+)/i]),
});

const sendParsedPdf = async (req, res, parser) => {
  if (!req.file?.path) {
    return res.status(400).json({ message: "PDF file is required" });
  }

  try {
    const text = await readPdfText(req.file.path);
    const extractedData = parser(text);

    return res.json({
      ...extractedData,
      rawText: text,
    });
  } catch (error) {
    console.error("Error processing PDF:", error);
    return res.status(500).json({
      message:
        "Could not extract text from this PDF. Use a text-based report or enter values manually.",
    });
  } finally {
    await fs.unlink(req.file.path).catch(() => {});
  }
};

export const heartScraper = (req, res) => sendParsedPdf(req, res, parseHeartReport);

export const diabetesScraper = (req, res) =>
  sendParsedPdf(req, res, parseDiabetesReport);
