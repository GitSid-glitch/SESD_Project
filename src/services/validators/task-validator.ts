const HttpError = require("../../core/http-error");
const { ValidationRule, ValidationPipeline } = require("../../patterns/validation-pipeline");

class TaskRequiredFieldsRule extends ValidationRule {
  validate({ payload }) {
    if (!payload.title || !payload.description || !payload.projectId) {
      throw new HttpError(400, "title, description, and projectId are required");
    }
  }
}

class TaskTitleRule extends ValidationRule {
  validate({ payload }) {
    if (String(payload.title).trim().length < 3) {
      throw new HttpError(400, "Task title must be at least 3 characters long");
    }
  }
}

class TaskDescriptionRule extends ValidationRule {
  validate({ payload }) {
    if (String(payload.description).trim().length < 10) {
      throw new HttpError(400, "Task description must be at least 10 characters long");
    }
  }
}

class TaskDueDateRule extends ValidationRule {
  validate({ payload }) {
    if (payload.dueDate && Number.isNaN(new Date(payload.dueDate).getTime())) {
      throw new HttpError(400, "Task dueDate must be a valid date");
    }
  }
}

class TaskValidator {
  pipeline;

  constructor() {
    this.pipeline = new ValidationPipeline([
      new TaskRequiredFieldsRule(),
      new TaskTitleRule(),
      new TaskDescriptionRule(),
      new TaskDueDateRule()
    ]);
  }

  validate(payload) {
    this.pipeline.run({ payload });
  }
}

module.exports = new TaskValidator();
