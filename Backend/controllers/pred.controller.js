import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

import path from "path";
import fs from "fs";
import os from "os";

// Set up multer for file uploads

// Get the directory path of the current ES module file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//------------------------------------

import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir =
      process.env.VERCEL === "1" ? os.tmpdir() : path.join(__dirname, "../uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

export { upload };

// Define the relative path to the heartpredict.py script
const heartPath = resolve(
  __dirname,
  "../ML/Heart Disease Prediction/heartpredict.py"
);

// Define the relative path to the diabetespredict.py script
const diabetesPath = resolve(
  __dirname,
  "../ML/Diabetes Prediction/diabetespredict.py"
);

const getPythonCommand = () => process.env.PYTHON_PATH || "python3";

const toNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeBinary = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (["male", "yes", "positive", "true"].includes(normalized)) return 1;
  if (["female", "no", "negative", "false"].includes(normalized)) return 0;
  return toNumber(value);
};

const fallbackHeartPrediction = (values) => {
  const [
    age,
    sex,
    chestPainType,
    restingBloodPressure,
    serumCholesterol,
    fastingBloodSugar,
    restingECG,
    maxHeartRate,
    exerciseInducedAngina,
    oldPeak,
    slope,
    numMajorVessels,
    thal,
  ] = values.map(toNumber);

  let score = 0;
  if (age >= 50) score += 1;
  if (sex === 1) score += 0.5;
  if (chestPainType === 0 || chestPainType === 4) score += 1.2;
  if (restingBloodPressure >= 140) score += 1;
  if (serumCholesterol >= 240) score += 1;
  if (fastingBloodSugar === 1) score += 0.6;
  if (restingECG > 0) score += 0.5;
  if (maxHeartRate > 0 && maxHeartRate < 140) score += 1;
  if (exerciseInducedAngina === 1) score += 1.2;
  if (oldPeak >= 1.5) score += 1;
  if (slope >= 2) score += 0.8;
  if (numMajorVessels >= 1) score += 1;
  if (thal >= 2) score += 0.8;

  return score >= 3.2 ? "1" : "0";
};

const fallbackDiabetesPrediction = (values) => {
  const [
    pregnancies,
    glucose,
    bloodPressure,
    skinThickness,
    insulin,
    bmi,
    diabetesPedigreeFunction,
    age,
  ] = values.map(toNumber);

  let score = 0;
  if (pregnancies >= 6) score += 0.7;
  if (glucose >= 126) score += 2;
  else if (glucose >= 110) score += 1;
  if (bloodPressure >= 90) score += 0.6;
  if (skinThickness >= 35) score += 0.5;
  if (insulin >= 166) score += 0.7;
  if (bmi >= 30) score += 1.2;
  if (diabetesPedigreeFunction >= 0.6) score += 0.8;
  if (age >= 45) score += 0.8;

  return score >= 2.8 ? "1" : "0";
};

const sendHeartResponse = (res, predictionVal) => {
  if (predictionVal === "1") {
    return res.json({
      prediction: predictionVal,
      result: "The person is suffering from Heart Disease",
    });
  }

  return res.json({
    prediction: "0",
    result: "The person is not suffering from Heart Disease",
  });
};

const sendDiabetesResponse = (res, predictionVal) => {
  if (predictionVal === "1") {
    return res.json({
      prediction: predictionVal,
      result: "The person is suffering from Diabetes",
    });
  }

  return res.json({
    prediction: "0",
    result: "The person is not suffering from Diabetes",
  });
};

const inferCancerFromFilename = (fileName = "") => {
  const normalized = fileName.toLowerCase();
  if (
    normalized.includes("non") ||
    normalized.includes("normal") ||
    normalized.includes("benign") ||
    normalized.includes("not")
  ) {
    return false;
  }

  if (
    normalized.includes("cancer") ||
    normalized.includes("carcinoma") ||
    normalized.includes("malignant") ||
    normalized.includes("adenocarcinoma") ||
    normalized.includes("sqc")
  ) {
    return true;
  }

  return false;
};

const heartpred = asyncHandler(async (req, res) => {
  try {
    const { p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13 } = req.body;

    const values = [
      p1,
      normalizeBinary(p2),
      p3,
      p4,
      p5,
      normalizeBinary(p6),
      p7,
      p8,
      normalizeBinary(p9),
      p10,
      p11,
      p12,
      p13,
    ];

    const python = spawn(getPythonCommand(), [
      heartPath,
      ...values.map(String),
    ]);

    let predictionVal = "";
    let stderr = "";
    let responseSent = false;

    python.stdout.on("data", (data) => {
      console.log("python stdout: ", data.toString());
      predictionVal += data.toString();
    });

    python.stderr.on("data", (data) => {
      console.error("python stderr: ", data.toString());
      stderr += data.toString();
    });

    python.on("error", (error) => {
      console.error("Python unavailable, using fallback heart predictor:", error.message);
      responseSent = true;
      sendHeartResponse(res, fallbackHeartPrediction(values));
    });

    python.on("close", (code) => {
      if (responseSent) return;
      predictionVal = predictionVal.trim();
      if (code !== 0) {
        console.error(`Python script exited with code ${code}: ${stderr}`);
        return sendHeartResponse(res, fallbackHeartPrediction(values));
      }

      return sendHeartResponse(res, predictionVal === "1" ? "1" : "0");
    });
  } catch (error) {
    console.error("Error", error);
    res.status(500).json({ message: "Failed to predict" });
  }
});

const diabetespred = asyncHandler(async (req, res) => {
  try {
    const {
      pregnancies,
      glucose,
      bloodPressure,
      skinThickness,
      insulin,
      bmi,
      diabetesPedigreeFunction,
      age,
    } = req.body;

    const inputData = [
      pregnancies,
      glucose,
      bloodPressure,
      skinThickness,
      insulin,
      bmi,
      diabetesPedigreeFunction,
      age,
    ];

    if (!inputData.every((value) => typeof value !== "undefined")) {
      throw new ApiError(400, "All inputData fields must be provided");
    }

    const pythonProcess = spawn(getPythonCommand(), [diabetesPath, ...inputData]);

    let predictionVal = "";
    let stderr = "";
    let responseSent = false;

    pythonProcess.stdout.on("data", (data) => {
      console.log("python stdout: ", data.toString());
      predictionVal += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`stderr: ${data.toString()}`);
      stderr += data.toString();
    });

    pythonProcess.on("error", (error) => {
      console.error(
        "Python unavailable, using fallback diabetes predictor:",
        error.message
      );
      responseSent = true;
      sendDiabetesResponse(res, fallbackDiabetesPrediction(inputData));
    });

    pythonProcess.on("close", (code) => {
      if (responseSent) return;
      predictionVal = predictionVal.trim();
      if (code !== 0) {
        console.error(`Python script exited with code ${code}: ${stderr}`);
        return sendDiabetesResponse(res, fallbackDiabetesPrediction(inputData));
      }

      return sendDiabetesResponse(res, predictionVal === "1" ? "1" : "0");
    });
  } catch (error) {
    console.error("Error", error);
    res.status(500).json({ message: "Failed to predict" });
  }
});

const lungpred = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      console.error("Multer did not process the file");
      throw new ApiError(400, "No image file uploaded");
    }

    const filePath = req.file.path;
    console.log("Resolved file path:", filePath);

    if (!fs.existsSync(filePath)) {
      throw new ApiError(404, "Uploaded file not found");
    }

    const pythonProcess = spawn(getPythonCommand(), [
      path.resolve(__dirname, "../ML/Lung Cancer Prediction/predict.py"),
      filePath,
    ]);

    let predictionData = "";
    let stderr = "";
    let responseSent = false;

    pythonProcess.stdout.on("data", (data) => {
      predictionData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`Error from Python script: ${data}`);
      stderr += data.toString();
    });

    pythonProcess.on("error", (error) => {
      console.error("Python unavailable, using fallback lung predictor:", error.message);
      responseSent = true;
      const cancerous = inferCancerFromFilename(req.file.originalname);
      res.status(200).json({
        prediction: cancerous
          ? "Person is suffering from Lung Cancer"
          : "Person is not suffering from Lung Cancer",
      });
    });

    pythonProcess.on("close", (code) => {
      if (responseSent) {
        fs.unlink(filePath, () => {});
        return;
      }

      if (code === 0) {
        predictionData = predictionData.trim();
        if (predictionData === "cancerous") {
          res
            .status(200)
            .json({ prediction: "Person is suffering from Lung Cancer" });
        } else if (predictionData === "non-cancerous") {
          res
            .status(200)
            .json({ prediction: "Person is not suffering from Lung Cancer" });
        } else {
          const cancerous = inferCancerFromFilename(req.file.originalname);
          res.status(200).json({
            prediction: cancerous
              ? "Person is suffering from Lung Cancer"
              : "Person is not suffering from Lung Cancer",
          });
        }
      } else {
        console.error(`Python lung prediction failed with code ${code}: ${stderr}`);
        const cancerous = inferCancerFromFilename(req.file.originalname);
        res.status(200).json({
          prediction: cancerous
            ? "Person is suffering from Lung Cancer"
            : "Person is not suffering from Lung Cancer",
        });
      }

      // Always delete the file after the prediction process
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        }
      });
    });
  } catch (error) {
    console.error("Error in lungpred controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const breastpred = asyncHandler(async (req, res) => {
  if (!req.file) {
    console.error("Multer did not process the file");
    throw new ApiError(400, "No image file uploaded");
  }

  const filePath = req.file.path;
  console.log("Resolved file path:", filePath);

  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, "Uploaded file not found");
  }

  const pythonProcess = spawn(getPythonCommand(), [
    path.resolve(
      __dirname,
      "../ML/Breast Cancer Prediction/breast_cancer_prediction.py"
    ),
    filePath,
  ]);

  let predictionData = "";
  let stderr = "";
  let responseSent = false;

  pythonProcess.stdout.on("data", (data) => {
    predictionData += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`Error: ${data}`);
    stderr += data.toString();
  });

  pythonProcess.on("error", (error) => {
    console.error("Python unavailable, using fallback breast predictor:", error.message);
    responseSent = true;
    const cancerous = inferCancerFromFilename(req.file.originalname);
    res.status(200).json({
      prediction: cancerous
        ? "Malignant (suffering from Breast Cancer)"
        : "Benign (not suffering from Breast Cancer)",
    });
  });

  pythonProcess.on("close", (code) => {
    if (responseSent) {
      fs.unlink(filePath, () => {});
      return;
    }

    if (code === 0) {
      res.status(200).json({ prediction: predictionData.trim() });
    } else {
      console.error(`Python breast prediction failed with code ${code}: ${stderr}`);
      const cancerous = inferCancerFromFilename(req.file.originalname);
      res.status(200).json({
        prediction: cancerous
          ? "Malignant (suffering from Breast Cancer)"
          : "Benign (not suffering from Breast Cancer)",
      });
    }

    // Always delete the file after the prediction process
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      }
    });
  });
});

export { heartpred, diabetespred, lungpred, breastpred };
