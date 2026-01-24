import { ProfileModel } from "../models/profileModel.js";

// GET: Ottieni tutto il profilo dell'utente loggato
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await ProfileModel.getFullProfile(userId);
    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore server" });
  }
};

// POST: Aggiungi Esperienza
export const addExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const { company, role, startDate, endDate, description } = req.body;

    if (!company || !role || !startDate) {
      return res.status(400).json({ error: "Dati mancanti" });
    }

    const newItem = await ProfileModel.addExperience({
      userId,
      company,
      role,
      startDate,
      endDate,
      description,
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: "Errore server" });
  }
};

// POST: Aggiungi Istruzione
export const addEducation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { school, degree, field, startDate, endDate } = req.body;

    if (!school) return res.status(400).json({ error: "Scuola obbligatoria" });

    const newItem = await ProfileModel.addEducation({
      userId,
      school,
      degree,
      field,
      startDate,
      endDate,
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: "Errore server" });
  }
};

// POST: Aggiungi Skill
export const addSkill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, level } = req.body; // level da 1 a 5

    if (!name)
      return res.status(400).json({ error: "Nome skill obbligatorio" });

    const newItem = await ProfileModel.addSkill({
      userId,
      name,
      level: level || 1,
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: "Errore server" });
  }
};

// DELETE: Generic Delete (gestiamo routing separato per tipo)
export const deleteItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { type } = req.query; // ?type=experience | education | skill

    if (type === "experience") await ProfileModel.deleteExperience(id, userId);
    else if (type === "education")
      await ProfileModel.deleteEducation(id, userId);
    else if (type === "skill") await ProfileModel.deleteSkill(id, userId);
    else return res.status(400).json({ error: "Tipo non valido" });

    res.json({ message: "Elemento eliminato" });
  } catch (error) {
    res.status(500).json({ error: "Errore server" });
  }
};
