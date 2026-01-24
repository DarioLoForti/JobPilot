import { JobModel } from "../models/jobModel.js";

// Aggiungi nuova candidatura
export const addJob = async (req, res) => {
  try {
    const { companyName, jobTitle, jobUrl, status, notes } = req.body;

    // L'ID utente arriva dal token (grazie al middleware protect)
    const userId = req.user.id;

    if (!companyName || !jobTitle) {
      return res
        .status(400)
        .json({ error: "Nome azienda e posizione sono obbligatori" });
    }

    const newJob = await JobModel.create({
      userId,
      companyName,
      jobTitle,
      jobUrl,
      status,
      notes,
    });

    res.status(201).json(newJob);
  } catch (error) {
    console.error("Errore creazione job:", error);
    res.status(500).json({ error: "Errore del server" });
  }
};

// Ottieni tutte le mie candidature
export const getMyJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobs = await JobModel.findAllByUserId(userId);
    res.json(jobs);
  } catch (error) {
    console.error("Errore recupero jobs:", error);
    res.status(500).json({ error: "Errore del server" });
  }
};
