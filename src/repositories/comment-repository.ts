const BaseRepository = require("./base-repository");
const Comment = require("../models/comment");

class CommentRepository extends BaseRepository {
  constructor() {
    super("comments", Comment);
  }

  findByTaskId(taskId) {
    return this.findAll().filter((comment) => Number(comment.taskId) === Number(taskId));
  }
}

module.exports = new CommentRepository();
