const mongoose = require('mongoose');

class BaseModel {
  constructor() {
    if (!mongoose.connection.readyState) {
      throw new Error("需要先建立数据库连接");
    }
    if (typeof this.getSchema !== 'function') {
      throw new Error("必须实现getSchema方法");
    }
    this.name = this.getName();
    this.schema = new mongoose.Schema(this.getSchema());
    this.model = mongoose.models[this.name] || 
                mongoose.model(this.name, this.schema);
  }

  getSchema() {
    throw new Error("必须实现getSchema方法");
  }

  getName() {
    throw new Error("必须实现getName方法");
  }
}
module.exports = BaseModel;