const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  tokenHash:{type:String,required:true,unique:true,index:true},
  createdBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
  targetType:{type:String,enum:["election","campaign","event"],required:true,index:true},
  targetId:{type:mongoose.Schema.Types.ObjectId,required:true,index:true},
  electionId:{type:mongoose.Schema.Types.ObjectId,ref:"Election",default:null,index:true},
  roleName:{type:String,required:true,trim:true},
  roleDescription:{type:String,trim:true,default:""},
  kind:{type:String,enum:["role","assignment"],default:"assignment"},
  personId:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null,index:true},
  location:{type:Object,default:null},
  responsibilities:{type:String,trim:true,default:""},
  status:{type:String,enum:["pending","accepted","declined","revoked","expired"],default:"pending",index:true},
  expiresAt:{type:Date,required:true,index:true},
  acceptedAt:{type:Date,default:null},
  declinedAt:{type:Date,default:null},
},{timestamps:true});
schema.index({createdBy:1,targetType:1,targetId:1,createdAt:-1});
module.exports=mongoose.models.WorkspaceRoleInvitation||mongoose.model("WorkspaceRoleInvitation",schema);
