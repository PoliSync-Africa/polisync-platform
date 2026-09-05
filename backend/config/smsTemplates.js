// ============================================================
// POLISYNC AFRICA — SMS TEMPLATE SERVICE
// ============================================================
//
// Responsible for:
// - Loading centralized SMS templates
// - Replacing template variables
// - Validating required variables
// - Preventing accidental unresolved placeholders
// - Preparing personalized SMS messages
//
// This service does NOT:
// - Send SMS
// - Store API keys
// - Connect directly to Arkesel
//
// SMS delivery is handled separately by the SMS services.
//
// ============================================================

const SMS_TEMPLATES = require("../config/smsTemplates");

// ============================================================
// TEMPLATE VARIABLE REGEX
// ============================================================

const VARIABLE_PATTERN = /\{\{([a-zA-Z0-9_]+)\}\}/g;

// ============================================================
// CONVERT VALUE TO SAFE TEXT
// ============================================================

const normalizeValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

// ============================================================
// FIND TEMPLATE
// ============================================================

const getTemplate = (templateKey) => {
  if (!templateKey) {
    throw new Error("SMS template key is required.");
  }

  const template = SMS_TEMPLATES[templateKey];

  if (!template) {
    throw new Error(`SMS template "${templateKey}" does not exist.`);
  }

  if (!template.template) {
    throw new Error(`SMS template "${templateKey}" has no message content.`);
  }

  return template;
};

// ============================================================
// EXTRACT VARIABLES
// ============================================================

const getTemplateVariables = (template) => {
  const variables = new Set();

  let match;

  while ((match = VARIABLE_PATTERN.exec(template)) !== null) {
    variables.add(match[1]);
  }

  // Reset regex state.
  VARIABLE_PATTERN.lastIndex = 0;

  return Array.from(variables);
};

// ============================================================
// VALIDATE TEMPLATE DATA
// ============================================================

const validateTemplateData = ({ templateKey, template, data, strict = true, }) => {
  const variables = getTemplateVariables(template);

  const missing = [];

  for (const variable of variables) {
    const value = data?.[variable];

    if (value === undefined || value === null || String(value).trim() === "") {
      missing.push(variable);
    }
  }

  if (strict && missing.length > 0) {
    throw new Error(
      `Missing SMS template variables for "${templateKey}": ${missing.join( ", " )}.`
    );
  }

  return {
    valid: missing.length === 0,

    missing,
  };
};

// ============================================================
// RENDER TEMPLATE
// ============================================================
//
// Example:
//
// renderTemplate(
// "ACCOUNT_APPROVED",
// {
// firstName: "Daniel"
// }
// )
//
// Returns:
//
// Hello Daniel, your PoliSync Africa account has been approved.
// You can now sign in and access the platform.
//
// ============================================================

const renderTemplate = (templateKey, data = {}, options = {}) => {
  const { strict = true, trim = true } = options;

  const templateObject = getTemplate(templateKey);

  const template = templateObject.template;

  validateTemplateData({
    templateKey,

    template,

    data,

    strict,
  });

  let message = template.replace(
    VARIABLE_PATTERN,
    (fullMatch, variableName) => {
      const value = data[variableName];

      if (value === undefined || value === null) {
        return "";
      }

      return normalizeValue(value);
    }
  );

  // ----------------------------------------------------------
  // SAFETY CHECK
  // ----------------------------------------------------------

  const unresolved = message.match(VARIABLE_PATTERN);

  if (unresolved && unresolved.length > 0) {
    throw new Error(
      `SMS template "${templateKey}" contains unresolved variables: ${unresolved.join( ", " )}.`
    );
  }

  if (trim) {
    message = message.trim();
  }

  if (!message) {
    throw new Error(`SMS template "${templateKey}" produced an empty message.`);
  }

  return message;
};

// ============================================================
// RENDER SMS
// ============================================================
//
// This is the main method controllers/services can use.
//
// ============================================================

const createSMS = (templateKey, data = {}, options = {}) => {
  const message = renderTemplate(templateKey, data, options);

  return {
    templateKey,

    message,

    characterCount: message.length,
  };
};

// ============================================================
// CHECK TEMPLATE WITHOUT THROWING
// ============================================================
//
// Useful for administrative tools and testing.
//
// ============================================================

const inspectTemplate = (templateKey, data = {}) => {
  const templateObject = getTemplate(templateKey);

  const variables = getTemplateVariables(templateObject.template);

  const validation = validateTemplateData({
    templateKey,

    template: templateObject.template,

    data,

    strict: false,
  });

  return {
    templateKey,

    name: templateObject.name || templateKey,

    template: templateObject.template,

    variables,

    missing: validation.missing,

    ready: validation.valid,
  };
};

// ============================================================
// LIST AVAILABLE SMS TEMPLATES
// ============================================================

const listTemplates = () => {
  return Object.keys(SMS_TEMPLATES).map((templateKey) => ({
    templateKey,

    name: SMS_TEMPLATES[templateKey].name || templateKey,

    template: SMS_TEMPLATES[templateKey].template,

    variables: getTemplateVariables(SMS_TEMPLATES[templateKey].template),
  }));
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  getTemplate,

  getTemplateVariables,

  validateTemplateData,

  renderTemplate,

  createSMS,

  inspectTemplate,

  listTemplates,
};
