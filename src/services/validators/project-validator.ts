const HttpError = require("../../core/http-error");
const { ValidationRule, ValidationPipeline } = require("../../patterns/validation-pipeline");

class ProjectTitleRule extends ValidationRule {
  validate({ payload, partial }) {
    if (!partial || Object.prototype.hasOwnProperty.call(payload, "title")) {
      if (!payload.title || String(payload.title).trim().length < 3) {
        throw new HttpError(400, "Project title must be at least 3 characters long");
      }
    }
  }
}

class ProjectDescriptionRule extends ValidationRule {
  validate({ payload, partial }) {
    if (!partial || Object.prototype.hasOwnProperty.call(payload, "description")) {
      if (!payload.description || String(payload.description).trim().length < 10) {
        throw new HttpError(400, "Project description must be at least 10 characters long");
      }
    }
  }
}

class ProjectValidator {
  pipeline;

  constructor() {
    this.pipeline = new ValidationPipeline([new ProjectTitleRule(), new ProjectDescriptionRule()]);
  }

  validate(payload, partial = false) {
    this.pipeline.run({ payload, partial });
  }
}

module.exports = new ProjectValidator();
