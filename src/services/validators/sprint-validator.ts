const HttpError = require("../../core/http-error");
const { ValidationRule, ValidationPipeline } = require("../../patterns/validation-pipeline");

class SprintNameRule extends ValidationRule {
  validate({ payload }) {
    if (!payload.name || String(payload.name).trim().length < 3) {
      throw new HttpError(400, "Sprint name must be at least 3 characters long");
    }
  }
}

class SprintDatePresenceRule extends ValidationRule {
  validate({ payload }) {
    if (!payload.startDate || !payload.endDate) {
      throw new HttpError(400, "Sprint start and end dates are required");
    }
  }
}

class SprintDateOrderRule extends ValidationRule {
  validate({ payload }) {
    if (new Date(payload.endDate) < new Date(payload.startDate)) {
      throw new HttpError(400, "Sprint end date cannot be before the start date");
    }
  }
}

class SprintValidator {
  pipeline;

  constructor() {
    this.pipeline = new ValidationPipeline([
      new SprintNameRule(),
      new SprintDatePresenceRule(),
      new SprintDateOrderRule()
    ]);
  }

  validate(payload) {
    this.pipeline.run({ payload });
  }
}

module.exports = new SprintValidator();
