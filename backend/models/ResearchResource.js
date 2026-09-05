const mongoose = require("mongoose");
const resourceSchema = new mongoose.Schema({
  key:{type:String,required:true,unique:true,index:true},title:{type:String,required:true,trim:true},
  category:{type:String,enum:["electoral_geography","election_results","candidates","parties","research_data","public_records","methodology","newsroom","fact_checking","calendar","campaign_operations","field_operations","news"],required:true},
  description:{type:String,required:true,trim:true},audience:[{type:String,enum:["personal_use","researcher","journalist"]}],
  access:{type:String,enum:["public","research","journalist","personal"],default:"public"},actions:[{type:String,trim:true}],route:{type:String,required:true},isActive:{type:Boolean,default:true}
},{timestamps:true});
module.exports=mongoose.models.ResearchResource||mongoose.model("ResearchResource",resourceSchema);
