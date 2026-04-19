const BaseRepository = require("./base-repository");
const Comment = require("../models/comment");

class CommentRepository extends BaseRepository {
  constructor() {
    super("comments", Comment);
  }

  async findByTaskId(taskId) {
    return (await this.findAll()).filter((comment) => Number(comment.taskId) === Number(taskId));
  }
}

module.exports = new CommentRepository();
