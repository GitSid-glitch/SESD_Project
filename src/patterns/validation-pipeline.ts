class ValidationRule {
  validate(context) {
    throw new Error("validate() must be implemented by subclasses");
  }
}

class ValidationPipeline {
  rules;

  constructor(rules = []) {
    this.rules = rules;
  }

  run(context) {
    this.rules.forEach((rule) => rule.validate(context));
  }
}

module.exports = {
  ValidationRule,
  ValidationPipeline
};
