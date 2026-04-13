class Comment {
  id;
  content;
  taskId;
  userId;
  createdAt;
  updatedAt;

  constructor({
    id,
    content,
    taskId,
    userId,
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    this.id = id;
    this.content = content;
    this.taskId = taskId;
    this.userId = userId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  editComment(content) {
    this.content = content;
    this.updatedAt = new Date().toISOString();
  }
}

module.exports = Comment;
