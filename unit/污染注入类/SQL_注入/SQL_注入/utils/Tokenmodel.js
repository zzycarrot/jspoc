const BaseModel = require('./Basemodel.js');
const mongoose = require('mongoose');
class TokenModel extends BaseModel {
    constructor() {
      super();
      this.name = 'tokens'; 
    }
    getSchema() {
      return {
        token: { 
          type: String, 
          required: true,
          unique: true,
          index: true  
        },
        project_id: {
          // type: mongoose.Schema.Types.ObjectId,
          type: String,
          ref: 'Project'  
        },
        expiresAt: {
          type: Date,
          default: () => new Date(+new Date() + 7 * 24 * 60 * 60 * 1000) 
        }
      };
    }
  
    getName() {
      return 'tokens'; 
    }

    static async generateToken(projectId) {
        try {
          // 生成JWT 7-days
          const token = jwt.sign(
            { pid: projectId },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
          );

          const tokenDoc = await this.model.create({
            token,
            project_id: projectId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          });
    
          return {
            token: tokenDoc.token,
            expiresAt: tokenDoc.expiresAt
          };
        } catch (error) {
          if (error.code === 11000) {
            throw new Error('Token冲突，请重试生成');
          }
          throw new Error(`Token生成失败: ${error.message}`);
        }
      }
    findId(token) {
        return this.model
          .findOne({
            token: token
          })
          .select('project_id')
          .exec();
      }
    static async createIndexes() {
        try {
          if (!this.model) {
            await new Promise(resolve => mongoose.connection.once('open', resolve));
          }
          return await this.model.createIndexes();
        } catch (err) {
          console.error('索引创建失败:', err);
        }
      }
    async insertTokenWithProject(token, project_id) {
      try {
        const newDoc = await this.model.create({
          token: token,
          project_id: project_id
        });
        const doc = new this.model(newDoc);
        const result = await doc.save();
        // console.log("插入结果:", result);
        return result;
      } catch (error) {
        // 处理唯一键冲突（如 token 重复）
        if (error.code === 11000) {
          return { success: false, error: "Token 已存在" };
        }
        return { success: false, error: error.message };
      }
    }
    
  }

exports.tokenModel = TokenModel;
