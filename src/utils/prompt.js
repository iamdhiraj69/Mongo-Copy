import inquirer from "inquirer";
import logger from "./logger.js";

async function confirmAction(message, defaultValue = false) {
  try {
    const { ok } = await inquirer.prompt([
      {
        type: "confirm",
        name: "ok",
        message,
        default: defaultValue,
      },
    ]);
    return !!ok;
  } catch (err) {
    logger.error(`Prompt failed: ${err?.message ?? err}`);
    return false;
  }
}

async function askInput(message, { defaultValue = "", validate = null } = {}) {
  try {
    const { value } = await inquirer.prompt([
      {
        type: "input",
        name: "value",
        message,
        default: defaultValue,
        validate:
          validate ||
          ((v) =>
            v && String(v).trim().length ? true : "Value cannot be empty"),
        filter: (v) => (typeof v === "string" ? v.trim() : v),
      },
    ]);
    return value;
  } catch (err) {
    logger.error(`Prompt failed: ${err?.message ?? err}`);
    return defaultValue;
  }
}

async function askSelect(message, choices = [], { defaultIndex = 0 } = {}) {
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new Error("askSelect requires a non-empty choices array");
  }
  try {
    const { selected } = await inquirer.prompt([
      {
        type: "list",
        name: "selected",
        message,
        choices,
        default: defaultIndex,
      },
    ]);
    return selected;
  } catch (err) {
    logger.error(`Prompt failed: ${err?.message ?? err}`);
    return null;
  }
}

async function askMultiSelect(message, choices = [], { pageSize = 10 } = {}) {
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new Error("askMultiSelect requires a non-empty choices array");
  }
  try {
    const { selected } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selected",
        message,
        choices,
        pageSize,
      },
    ]);
    return selected;
  } catch (err) {
    logger.error(`Prompt failed: ${err?.message ?? err}`);
    return [];
  }
}

export { confirmAction, askInput, askSelect, askMultiSelect };
export default { confirmAction, askInput, askSelect, askMultiSelect };
